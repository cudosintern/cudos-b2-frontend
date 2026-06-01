import React, { useState } from "react";
import { toast } from "react-toastify";
import {
    FaPencilAlt,
    FaTrashAlt,
    FaSave,
    FaTimes,
    FaPlus,
    FaRegQuestionCircle,
    FaBook,
    FaUndo
} from "react-icons/fa";
import { Topic } from "./types";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";

interface Book {
    slNo: number;
    author: string;
    title: string;
    edition: string;
    website: string;
    publication: string;
    year: string;
    type: "Text Book" | "Reference Book";
}

interface Assessment {
    assessment: string;
    mode: string;
    weightage: number | string;
}

interface CourseUtilizationManagerProps {
    topic: Topic | null;
    curriculumLabel: string;
    termLabel: string;
    courseLabel: string;
    topics: Topic[];
    onClose: () => void;
    initialBooks: Book[];
    initialAssessments: Assessment[];
    initialShowTable: boolean;
    initialData: Record<string, string>;
    onSave: (books: Book[], assessments: Assessment[], showTable: boolean, data: Record<string, string>) => void;
}

const CourseUtilizationManager: React.FC<CourseUtilizationManagerProps> = ({
    topic,
    curriculumLabel,
    termLabel,
    courseLabel,
    topics,
    onClose,
    initialBooks,
    initialAssessments,
    initialShowTable,
    initialData,
    onSave
}) => {
    // Books State
    const [bookList, setBookList] = useState<Book[]>(initialBooks);
    const [bookForm, setBookForm] = useState<Partial<Book>>({
        type: "Text Book",
        author: "",
        title: "",
        website: "",
        edition: "",
        publication: "",
        year: ""
    });
    const [editingBookIndex, setEditingBookIndex] = useState<number | null>(null);

    // Search & Pagination State for Books
    const [bookSearch, setBookSearch] = useState("");
    const [bookEntries, setBookEntries] = useState(20);
    const [bookPage, setBookPage] = useState(1);

    // Filtering & Pagination Logic
    const filteredBooks = bookList.filter(b => 
        b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
        b.author.toLowerCase().includes(bookSearch.toLowerCase())
    );

    const pagedBooks = filteredBooks.slice((bookPage - 1) * bookEntries, bookPage * bookEntries);

    // Assessment State
    const [assessments, setAssessments] = useState<Assessment[]>(initialAssessments);

    // Utilization Table State
    const [showUtilizationTable, setShowUtilizationTable] = useState(initialShowTable);
    const [utilizationData, setUtilizationData] = useState<Record<string, string>>(initialData);

    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { }
    });

    const [bookErrors, setBookErrors] = useState<Record<string, string>>({});

    const handleSaveBook = () => {
        const errors: Record<string, string> = {};
        const slNoVal = Number(bookForm.slNo);
        if (!bookForm.slNo && bookForm.slNo !== 0) errors.slNo = "Sl No. is required.";
        else if (isNaN(slNoVal) || slNoVal <= 0) errors.slNo = "This field must contain only Numbers.";
        if (!(bookForm.author ?? "").trim()) errors.author = "Book Author is required.";
        else if (/[@<>]/.test(bookForm.author ?? "")) errors.author = "Verify you have a valid entry.";
        if (!(bookForm.title ?? "").trim()) errors.title = "Book Title is required.";
        else if (/[@<>]/.test(bookForm.title ?? "")) errors.title = "Verify you have a valid entry.";
        if (bookForm.website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}([\/\w\-.?%&=]*)?$/i.test(bookForm.website ?? "")) {
            errors.website = "This is not a valid URL.";
        }

        if (Object.keys(errors).length > 0) {
            setBookErrors(errors);
            return;
        }
        setBookErrors({});

        if (editingBookIndex !== null) {
            const newList = [...bookList];
            newList[editingBookIndex] = { ...bookList[editingBookIndex], ...bookForm } as Book;
            setBookList(newList);
            setEditingBookIndex(null);
        } else {
            const nextSlNo = bookList.length > 0 ? (Math.max(...bookList.filter(b => b.type === bookForm.type).map(b => b.slNo)) || 0) + 1 : 1;
            setBookList([...bookList, { ...bookForm, slNo: nextSlNo } as Book]);
        }

        setBookForm({
            type: "Text Book",
            author: "",
            title: "",
            website: "",
            edition: "",
            publication: "",
            year: ""
        });
    };

    const handleEditBook = (book: Book) => {
        const realIndex = bookList.findIndex(b => b === book);
        setBookForm(bookList[realIndex]);
        setEditingBookIndex(realIndex);
    };

    const handleDeleteBook = (book: Book) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: "Are you sure that you want to delete this book? Once deleted, data cannot be retrieved back.",
            onConfirm: () => {
                setBookList(bookList.filter(b => b !== book));
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                toast.success("Book deleted successfully!");
            }
        });
    };

    const handleAddAssessment = () => {
        setAssessments([...assessments, { assessment: `Assessment ${assessments.length + 1}`, mode: "", weightage: 0 }]);
    };

    const handleDeleteAssessment = (index: number) => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Delete",
            message: "Are you sure that you want to delete this assessment? Once deleted, data cannot be retrieved back.",
            onConfirm: () => {
                setAssessments(assessments.filter((_, i) => i !== index));
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                toast.success("Assessment deleted successfully!");
            }
        });
    };

    const handleGenerateTable = () => {
        setShowUtilizationTable(true);
    };

    const handleRevert = () => {
        setConfirmDialog({
            isOpen: true,
            title: "Confirm Revert",
            message: "Are you sure you want to revert the CIA & TEE Evaluation Scheme? Current changes will be lost.",
            onConfirm: () => {
                setAssessments([
                    {
                        assessment: "Assessment 1",
                        mode: "Viva",
                        weightage: 50
                    }
                ]);
                setShowUtilizationTable(false);
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                toast.success("Evaluation scheme reverted to default.");
            }
        });
    };



    const handleSaveData = () => {
        onSave(bookList, assessments, showUtilizationTable, utilizationData);
        toast.success("Course utilization data saved successfully.");
    };

    const totalWeightage = assessments.reduce((sum, a) => sum + Number(a.weightage || 0), 0);

    const years = [];
    for (let i = new Date().getFullYear(); i >= 1990; i--) {
        years.push(i);
    }

    return (
        <div className="max-w-7xl mx-auto animate-fade-in">
            {/* 1️⃣ HEADER */}
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    Add / Edit Books for a Course : {courseLabel}
                </h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <FaTimes size={20} />
                </button>
            </div>

            {/* 2️⃣ READONLY CONTEXT INFO */}
            <div className="flex flex-wrap gap-x-8 gap-y-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Curriculum :</span>
                    <span className="text-sm font-semibold text-blue-700">{curriculumLabel || "—"}</span>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Term :</span>
                    <span className="text-sm font-semibold text-blue-700">{termLabel || "—"}</span>
                </div>
                <div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mr-2">Course :</span>
                    <span className="text-sm font-semibold text-blue-700">{courseLabel || "—"}</span>
                </div>
            </div>

            {/* 3️⃣ SHOW ENTRIES & SEARCH */}
            <div className="flex justify-between items-center mb-3 px-1">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span>Show</span>
                    <select 
                        className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        value={bookEntries}
                        onChange={(e) => { setBookEntries(Number(e.target.value)); setBookPage(1); }}
                    >
                        {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <span>entries</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-700">
                    <span>Search:</span>
                    <input
                        type="text"
                        className="border border-gray-300 rounded px-3 py-1 text-xs outline-none focus:ring-1 focus:ring-blue-500 w-48"
                        placeholder="Search books..."
                        value={bookSearch}
                        onChange={(e) => { setBookSearch(e.target.value); setBookPage(1); }}
                    />
                </div>
            </div>

            {/* 4️⃣ BOOK TABLE */}
            <div className="mb-6 overflow-x-auto border border-gray-300 rounded-lg shadow-sm">
                <table className="w-full border-collapse text-xs text-left">
                    <thead className="bg-[#f8fafc] text-gray-700 uppercase font-bold border-b border-gray-200">
                        <tr>
                            <th className="px-3 py-3 border-r border-gray-300 w-12">Sl No.</th>
                            <th className="px-3 py-3 border-r border-gray-300">Author</th>
                            <th className="px-3 py-3 border-r border-gray-300">Book Title</th>
                            <th className="px-3 py-3 border-r border-gray-300 w-16 text-center">Edition</th>
                            <th className="px-3 py-3 border-r border-gray-300">Website</th>
                            <th className="px-3 py-3 border-r border-gray-300">Publication</th>
                            <th className="px-3 py-3 border-r border-gray-300 w-24 text-center text-[10px]">Publication Year</th>
                            <th className="px-3 py-3 border-r border-gray-300">Text Book /Reference Book</th>
                            <th className="px-3 py-3 border-r border-gray-300 text-center w-12">Edit</th>
                            <th className="px-3 py-3 text-center w-12">Delete</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {pagedBooks.map((book, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="px-3 py-2 border-r border-gray-200 font-medium">{book.slNo}.</td>
                                <td className="px-3 py-2 border-r border-gray-200">{book.author}</td>
                                <td className="px-3 py-2 border-r border-gray-200">{book.title}</td>
                                <td className="px-3 py-2 border-r border-gray-200 text-center">{book.edition}</td>
                                <td className="px-3 py-2 border-r border-gray-200 text-blue-600 truncate max-w-[100px]">{book.website}</td>
                                <td className="px-3 py-2 border-r border-gray-200">{book.publication}</td>
                                <td className="px-3 py-2 border-r border-gray-200 text-center">{book.year}</td>
                                <td className="px-3 py-2 border-r border-gray-200">{book.type}</td>
                                <td className="px-3 py-2 border-r border-gray-200 text-center">
                                    <button onClick={() => handleEditBook(book)} className="text-orange-500 hover:text-orange-700 transition-colors"><FaPencilAlt className="w-3.5 h-3.5" /></button>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <button onClick={() => handleDeleteBook(book)} className="text-red-600 hover:text-red-800 transition-colors"><FaTrashAlt className="w-3.5 h-3.5" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination controls */}
            <div className="flex justify-between items-center text-[10px] text-gray-500 mb-8 px-1">
                <div>
                    Showing <span className="font-bold text-gray-700">{filteredBooks.length ? (bookPage - 1) * bookEntries + 1 : 0}</span> to{" "}
                    <span className="font-bold text-gray-700">{Math.min(bookPage * bookEntries, filteredBooks.length)}</span> of{" "}
                    <span className="font-bold text-gray-700">{filteredBooks.length}</span> entries
                </div>
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => setBookPage(bookPage - 1)}
                        disabled={bookPage === 1}
                        className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-all font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        &larr; Previous
                    </button>
                    <span className="w-7 h-7 flex items-center justify-center bg-blue-600 text-white rounded font-bold shadow-sm shadow-blue-200">{bookPage}</span>
                    <button 
                        onClick={() => setBookPage(bookPage + 1)}
                        disabled={bookPage * bookEntries >= filteredBooks.length}
                        className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 transition-all font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Next &rarr;
                    </button>
                </div>
            </div>

            {/* 5️⃣ ADD BOOK FORM */}
            <div className="space-y-5 bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-10">
                <div className="flex items-center gap-8 mb-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                        <input
                            type="radio"
                            name="bookType"
                            value="Text Book"
                            checked={bookForm.type === "Text Book"}
                            onChange={(e) => setBookForm({ ...bookForm, type: e.target.value as any })}
                            className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-gray-700">Text Book</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 cursor-pointer">
                        <input
                            type="radio"
                            name="bookType"
                            value="Reference Book"
                            checked={bookForm.type === "Reference Book"}
                            onChange={(e) => setBookForm({ ...bookForm, type: e.target.value as any })}
                            className="w-4 h-4 accent-blue-600"
                        />
                        <span className="text-gray-700">Reference Book</span>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    <div className="space-y-4">
                        <div className="flex items-start gap-4">
                            <label className="w-32 flex-shrink-0 text-xs font-bold text-gray-700 text-right uppercase tracking-wider pt-1.5">SI No. <span className="text-red-500">*</span> :</label>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter SI No"
                                    value={bookForm.slNo || ""}
                                    onChange={(e) => { setBookForm({ ...bookForm, slNo: Number(e.target.value) }); setBookErrors(p => ({ ...p, slNo: '' })); }}
                                    className={`w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm ${bookErrors.slNo ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {bookErrors.slNo && <p className="text-red-500 text-xs mt-1">{bookErrors.slNo}</p>}
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <label className="w-32 flex-shrink-0 text-xs font-bold text-gray-700 text-right uppercase tracking-wider pt-1.5">Book Author <span className="text-red-500">*</span> :</label>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter Author"
                                    value={bookForm.author}
                                    onChange={(e) => { setBookForm({ ...bookForm, author: e.target.value }); setBookErrors(p => ({ ...p, author: '' })); }}
                                    className={`w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm ${bookErrors.author ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {bookErrors.author && <p className="text-red-500 text-xs mt-1">{bookErrors.author}</p>}
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <label className="w-32 flex-shrink-0 text-xs font-bold text-gray-700 text-right uppercase tracking-wider pt-1.5">Book Title <span className="text-red-500">*</span> :</label>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter Title of the book"
                                    value={bookForm.title}
                                    onChange={(e) => { setBookForm({ ...bookForm, title: e.target.value }); setBookErrors(p => ({ ...p, title: '' })); }}
                                    className={`w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm ${bookErrors.title ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {bookErrors.title && <p className="text-red-500 text-xs mt-1">{bookErrors.title}</p>}
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <label className="w-32 flex-shrink-0 text-xs font-bold text-gray-700 text-right uppercase tracking-wider pt-1.5">Book Website :</label>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Enter Website for the book"
                                    value={bookForm.website}
                                    onChange={(e) => { setBookForm({ ...bookForm, website: e.target.value }); setBookErrors(p => ({ ...p, website: '' })); }}
                                    className={`w-full px-3 py-1.5 border rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm ${bookErrors.website ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {bookErrors.website && <p className="text-red-500 text-xs mt-1">{bookErrors.website}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-xs font-bold text-gray-700 text-right uppercase tracking-wider">Book Edition :</label>
                            <input
                                type="text"
                                placeholder="Enter Edition"
                                value={bookForm.edition}
                                onChange={(e) => setBookForm({ ...bookForm, edition: e.target.value })}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-xs font-bold text-gray-700 text-right uppercase tracking-wider">Publication :</label>
                            <input
                                type="text"
                                placeholder="Enter Publication"
                                value={bookForm.publication}
                                onChange={(e) => setBookForm({ ...bookForm, publication: e.target.value })}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="w-32 text-xs font-bold text-gray-700 text-right uppercase tracking-wider">Publication Year :</label>
                            <select
                                value={bookForm.year}
                                onChange={(e) => setBookForm({ ...bookForm, year: e.target.value })}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                            >
                                <option value="">Select Year</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={handleSaveBook}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-2"
                            >
                                <FaSave className="w-3 h-3" /> Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 6️⃣ CIA & TEE Evaluation Scheme */}
            <div className="mb-10 bg-white shadow-sm border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center p-4 mb-2 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FaPencilAlt className="w-4 h-4 text-blue-600" />
                        CIA & TEE Evaluation Scheme for Course : {courseLabel}
                    </h3>
                    <FaRegQuestionCircle className="text-gray-400 cursor-pointer hover:text-gray-600 w-5 h-5" />
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-3 gap-8 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-2">
                        <div>Assessment</div>
                        <div>Assessment Mode</div>
                        <div>Weightage in marks</div>
                    </div>

                    {assessments.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-3 gap-8 items-center group">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={item.assessment}
                                    onChange={(e) => {
                                        const newList = [...assessments];
                                        newList[idx].assessment = e.target.value;
                                        setAssessments(newList);
                                    }}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium text-gray-700"
                                />
                            </div>
                            <div className="flex items-center justify-center gap-3">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={item.mode === "Viva"}
                                        onChange={(e) => {
                                            const newList = [...assessments];
                                            newList[idx].mode = e.target.checked ? "Viva" : "";
                                            setAssessments(newList);
                                        }}
                                        className="w-4 h-4 accent-blue-600 rounded"
                                    />
                                    <span className="text-sm font-bold text-gray-700">Viva</span>
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={item.weightage}
                                    onChange={(e) => {
                                        const newList = [...assessments];
                                        newList[idx].weightage = e.target.value;
                                        setAssessments(newList);
                                    }}
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm text-center font-bold text-gray-800"
                                />
                                {assessments.length > 1 && (
                                    <button onClick={() => handleDeleteAssessment(idx)} className="text-red-600 hover:text-red-800 transition-colors p-1">
                                        <FaTrashAlt className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="grid grid-cols-3 gap-8 items-center border-t border-gray-200 pt-4 mt-2">
                        <div className="text-right font-bold text-gray-500 text-xs uppercase tracking-wider">Total Marks :</div>
                        <div></div>
                        <input
                            type="text"
                            value={totalWeightage}
                            readOnly
                            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-300 rounded text-sm text-center font-black text-blue-700 shadow-inner"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                        <button
                            onClick={handleAddAssessment}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all border border-gray-300 shadow-sm"
                        >
                            <FaPlus className="w-2.5 h-2.5" /> Add More
                        </button>
                        <button
                            onClick={handleGenerateTable}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                            <FaBook className="w-3 h-3" /> Generate Table
                        </button>
                        <button
                            onClick={handleRevert}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-1.5 rounded flex items-center gap-2 text-xs font-bold transition-all shadow-md active:scale-95"
                        >
                            <FaUndo className="w-3 h-3" /> Revert
                        </button>
                    </div>
                </div>
            </div>

            {/* 7️⃣ Utilization Table */}
            {showUtilizationTable && (
                <div className="mb-10 bg-white shadow-sm border border-gray-200 rounded-lg animate-slide-up">
                    <div className="flex justify-between items-center p-4 mb-2 border-b border-gray-200 pb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FaBook className="w-4 h-4 text-blue-600" />
                            Course Unitization for CIA and TEE
                        </h3>
                        <FaRegQuestionCircle className="text-gray-400 cursor-pointer hover:text-gray-600 w-5 h-5" />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-xs text-left">
                            <thead className="bg-[#f8fafc] text-gray-700 uppercase font-bold border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-4 border-r border-gray-200">Topicss / Chapters</th>
                                    <th className="px-5 py-4 border-r border-gray-200 text-center w-32">Teaching Hours</th>
                                    {assessments.map((a, idx) => (
                                        <th key={idx} className="px-5 py-4 border-r border-gray-200 text-center uppercase tracking-tighter">
                                            No. of Questions for <br /> {a.assessment}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 font-medium">
                                {(Object.entries(
                                    topics.reduce((acc, topic) => {
                                        if (!acc[topic.unit]) acc[topic.unit] = [];
                                        acc[topic.unit].push(topic);
                                        return acc;
                                    }, {} as Record<string, Topic[]>)
                                ) as [string, Topic[]][]).map(([unit, unitTopics]) => (
                                    <React.Fragment key={unit}>
                                        <tr className="bg-gray-50/50 text-gray-800 border-b border-gray-200">
                                            <td colSpan={2 + assessments.length} className="px-5 py-2.5 text-center font-black uppercase tracking-widest text-[10px] bg-slate-50">{unit}</td>
                                        </tr>
                                        {unitTopics.map((t: Topic, idx: number) => (
                                            <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                                                <td className="px-5 py-3 border-r border-gray-200 text-gray-700 font-bold">{t.sl_no || idx + 1} {t.title}</td>
                                                <td className="px-5 py-3 border-r border-gray-200 text-center text-gray-600 font-mono tracking-tighter">{Number(t.hours).toFixed(2)}</td>
                                                {assessments.map((assessment, aIdx) => {
                                                    const key = `${t.id}-${aIdx}`;
                                                    return (
                                                        <td key={aIdx} className="px-5 py-3 border-r border-gray-200 text-center">
                                                            <input
                                                                type="text"
                                                                value={utilizationData[key] || "0.00"}
                                                                onChange={(e) => setUtilizationData({ ...utilizationData, [key]: e.target.value })}
                                                                className="w-24 px-2 py-1.5 border border-gray-300 rounded text-center outline-none focus:ring-1 focus:ring-blue-500 font-bold text-gray-800 shadow-sm"
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 8️⃣ BOTTOM ACTIONS */}
            <div className="flex justify-end gap-3 py-6 border-t border-gray-200 mt-6">
                <button
                    onClick={handleSaveData}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm font-bold"
                >
                    <FaSave className="w-4 h-4" /> Save
                </button>

                <button
                    onClick={onClose}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2 text-sm font-bold"
                >
                    <FaTimes className="w-4 h-4" /> Close
                </button>
            </div>

            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </div>
    );
};

export default CourseUtilizationManager;
