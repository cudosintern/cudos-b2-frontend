// components/ReadinessAlerts.tsx
import React from 'react';
import { OccasionStatus } from '../types/mteAttainment.types';

interface ReadinessAlertsProps {
    occasionStatus: OccasionStatus[];
}

const ReadinessAlerts: React.FC<ReadinessAlertsProps> = ({ occasionStatus }) => {
    const failedOccasions = occasionStatus.filter((os) => !os.is_ready);

    if (failedOccasions.length === 0) return null;

    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Cannot finalize – missing data</h3>
                    <div className="mt-2 text-sm text-red-700">
                        <ul className="list-disc pl-5 space-y-1">
                            {failedOccasions.map((os) => (
                                <li key={os.ao_id}>
                                    Occasion ID {os.ao_id}: {os.error_message || 'Data not ready'}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <p className="mt-2 text-sm text-red-700">
                        Please upload course MTE data and ensure question papers are rolled out.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ReadinessAlerts;