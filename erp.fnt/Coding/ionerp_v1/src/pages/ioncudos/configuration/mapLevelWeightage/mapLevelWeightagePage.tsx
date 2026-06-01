import React, { useEffect, useState, useMemo } from "react";
import { useAxios } from "../../../../hooks/useAxios";
import { MapLevelWeightageItem } from "./responseInterface";
import { FaSave } from "react-icons/fa";

const ApiEndpoint = {
    get_list: "cudos/map-level-weightage/get_map_level_weightage",
    save_list: "cudos/map-level-weightage/save_map_level_weightage",
};

const MapLevelWeightagePage: React.FC = () => {
    const [items, setItems] = useState<MapLevelWeightageItem[]>([]);

    const axiosPayload = useMemo(() => ({}), []);
    const axiosOptions = useMemo(() => ({
        method: "get" as const,
        loader: true,
        payload: axiosPayload,
        shouldFetch: true,
    }), [axiosPayload]);

    const { responseData, addItem, refetch } = useAxios<any, any>(
        ApiEndpoint.get_list,
        axiosOptions
    );

    useEffect(() => {
        if (responseData && Array.isArray(responseData)) {
            if (responseData.length === 0) {
                // Seed defaults if empty
                setItems([
                    { map_level_name: "High", map_level_short_form: "3", map_level: 3, map_level_weightage: 100.00, status: 1 },
                    { map_level_name: "Medium", map_level_short_form: "2", map_level: 2, map_level_weightage: 50.00, status: 1 },
                    { map_level_name: "Low", map_level_short_form: "1", map_level: 1, map_level_weightage: 0.00, status: 1 },
                ]);
            } else {
                setItems(responseData);
            }
        }
    }, [responseData]);

    const handleChange = (index: number, field: keyof MapLevelWeightageItem, value: any) => {
        const newItems = [...items];

        // ✅ If status is changed to unchecked (0)
        if (field === "status" && value === 0) {
            newItems[index] = {
                ...newItems[index],
                status: 0,
                map_level_weightage: 0 // 🔥 FORCE 0 HERE
            };
        } else {
            newItems[index] = {
                ...newItems[index],
                [field]: value
            };
        }

        setItems(newItems);
    };

    const totalWeightage = items.reduce((sum, item) => {
        if (Number(item.status) === 1) {
            return sum + (Number(item.map_level_weightage) || 0);
        }
        return sum;
    }, 0);

    const handleSubmit = async () => {
        const response = await addItem(items, ApiEndpoint.save_list);
        if (response) {
            refetch();
        }
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-gray-800">Map Level Weightage Distribution</h3>
                </div>
            </div>

            <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Sl No.</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Map Level <span className="text-red-500">*</span></th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Map Level Acronym <span className="text-red-500">*</span></th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Weightage in %</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{index + 1}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="text"
                                        value={item.map_level_name}
                                        onChange={(e) => handleChange(index, "map_level_name", e.target.value)}
                                        disabled={Number(item.status) === 0}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow duration-150 ease-in-out disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="text"
                                        value={item.map_level_name_alias || ""}
                                        onChange={(e) => handleChange(index, "map_level_name_alias", e.target.value)}
                                        disabled={Number(item.status) === 0}
                                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow duration-150 ease-in-out disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={Number(item.status) === 1}
                                            onChange={(e) => handleChange(index, "status", e.target.checked ? 1 : 0)}
                                            className="form-checkbox h-5 w-5 text-blue-600 transition duration-150 ease-in-out rounded border-gray-300 focus:ring-blue-500"
                                        />
                                    </label>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="relative rounded-md shadow-sm max-w-[150px]">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.map_level_weightage}
                                            onChange={(e) => handleChange(index, "map_level_weightage", parseFloat(e.target.value))}
                                            disabled={Number(item.status) === 0}
                                            className="block w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-right transition-shadow duration-150 ease-in-out disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        />
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">%</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-end items-center gap-4">
                <div className="flex items-center bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                    <span className="text-sm font-medium text-gray-700 mr-2">Total Weightage:</span>
                    <span className={`text-lg font-bold ${totalWeightage === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                        {totalWeightage.toFixed(0)}%
                    </span>
                </div>

                <button
                    onClick={handleSubmit}
                    className="inline-flex justify-center items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                >
                    <FaSave className="mr-2 -ml-1 h-4 w-4" />
                    Update
                </button>
            </div>
        </div>
    );
};

export default MapLevelWeightagePage;