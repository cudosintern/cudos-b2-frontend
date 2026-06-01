import React from 'react';
import styles from '../mtedataimport/mteImportReview/mteImportReview.module.css';

const SEEInstructions: React.FC = () => {
    return (
        <div className={styles.metaStrip} style={{ marginTop: 14, padding: '12px 20px', backgroundColor: '#fcfcfc', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: '#334155' }}>Steps:</div>
            <ol style={{ paddingLeft: 18, margin: 0, fontSize: 12, lineHeight: 1.8, color: '#475569' }}>
                <li>
                    Click on <strong className="text-red-600">"Upload"</strong> button to upload the .xls file. 
                    Make sure that the <strong className="text-yellow-800">file name</strong> and <strong className="text-yellow-800">file headers</strong> are not altered.
                </li>
                <li>Upon upload, curriculum, student USN, sub questions with their marks and remarks will be displayed.</li>
                <li>
                    Click on <strong className="text-red-600">"Accept"</strong> button to save the student data and return back to list page. 
                    Make sure that all the <strong className="text-yellow-800">remarks are resolved</strong> before proceeding.
                </li>
                <li>
                    Click on <strong className="text-red-600">"Cancel"</strong> button to discard (if any file has been uploaded) and return back to list page.
                </li>
                <li>To replace students' data follow step 1.</li>
            </ol>
        </div>
    );
};

export default SEEInstructions;
