import React, { useState } from "react";
import { FaExternalLinkAlt, FaSearch, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (questionIds: number[]) => Promise<void>;
  fetchQuestions: (courseName: string) => Promise<any[]>;
}

const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  isOpen,
  onClose,
  onImport,
  fetchQuestions,
}) => {
  const [courseName, setCourseName] = useState("");
  const [questions, setQuestions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async () => {
    if (!courseName.trim()) {
      toast.warning("Please enter a course name to search");
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const results = await fetchQuestions(courseName);
      setQuestions(results || []);
      setSelectedIds([]); // reset selection
    } catch (error) {
      console.error("Failed to fetch questions", error);
      toast.error("Failed to fetch questions from bank");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(questions.map((q) => q.question_id || q.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleImport = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one question to import");
      return;
    }

    setLoading(true);
    try {
      await onImport(selectedIds);
      // Let the parent manage success toasts and closing, or we can close here
      onClose();
    } catch (error) {
      // Let parent handle the error, but we stop loading
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FaExternalLinkAlt className="text-slate-600 w-4 h-4" />
            Import Questions from Bank
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                Course Name / Topic
              </label>
              <input
                type="text"
                placeholder="e.g. Data Structures"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 h-[42px]"
            >
              <FaSearch /> Search
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400 font-medium">Searching question bank...</div>
          ) : hasSearched && questions.length === 0 ? (
            <div className="py-12 text-center text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
              No questions found for "{courseName}"
            </div>
          ) : questions.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50/80">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        onChange={handleToggleAll}
                        checked={selectedIds.length === questions.length}
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600">Question</th>
                    <th className="px-4 py-3 text-left font-bold text-gray-600 w-32">Type</th>
                    <th className="px-4 py-3 text-center font-bold text-gray-600 w-24">Bloom's</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {questions.map((q) => {
                    const id = q.question_id || q.id;
                    return (
                      <tr key={id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(id)}
                            onChange={() => handleToggleSelection(id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          <div dangerouslySetInnerHTML={{ __html: q.question || "" }} className="prose prose-sm max-w-none" />
                        </td>
                        <td className="px-4 py-3 text-gray-600">{q.type || "N/A"}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-bold text-gray-600">
                            {q.bloom_level || q.bloom || "-"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-100">
          <div className="text-sm font-bold text-gray-500">
            {selectedIds.length} question(s) selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || selectedIds.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-bold shadow-md transition-all flex items-center gap-2"
            >
              {loading ? "Importing..." : "Import Selected"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionBankModal;
