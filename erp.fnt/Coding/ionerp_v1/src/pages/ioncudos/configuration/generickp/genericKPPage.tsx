import React, { useEffect, useState, useCallback, useMemo } from "react";
import { GoPencil } from "react-icons/go";
import { MdOutlineDoNotDisturbAlt } from "react-icons/md";
import DataTable from "../../../../components/Table/DataTable";
import ModalWithForm from "../../../../components/Modal/ModalWithForm";
import ConfirmDialog from "../../../../components/Dialog/ConfirmDialog";
import { useAxios } from "../../../../hooks/useAxios";
import { GenericKPSchemaFields, GenericKPSchema } from "./genericKPSchema";
import { GenericKP } from "./responseInterface";
import { ApiEndpoint } from "../../../../utils/ApiEndpoint/emsapiEndpoint";
import axiosInstance from "../../../../utils/api";
import { toast } from "react-toastify";

const GenericKPPage: React.FC = () => {
  const { responseData, addItem, editItem, refetch } = useAxios<
    Record<string, any>,
    GenericKP[]
  >(ApiEndpoint.knowledge_profile.list, {
    method: "get",
  });

  const [kpList, setKpList] = useState<GenericKP[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editRow, setEditRow] = useState<GenericKP | null>(null);
  const [deleteTriggerId, setDeleteTriggerId] = useState<number | null>(null);
  const [confirmMessage, setConfirmMessage] = useState<string>("");
  const [gridApi, setGridApi] = useState<any>(null);
  const [pageSize, setPageSize] = useState<number>(20);
  const [searchText, setSearchText] = useState<string>(() => {
    try {
      const saved = sessionStorage.getItem("genericKPSearchText");
      return saved || "";
    } catch {
      return "";
    }
  });

  // ================= FETCH LIST =================
  useEffect(() => {
    if (responseData) {
      setKpList(Array.isArray(responseData) ? responseData : []);
    }
  }, [responseData]);

  // Save search text to session
  useEffect(() => {
    sessionStorage.setItem("genericKPSearchText", searchText);
  }, [searchText]);

  // ================= ADD / UPDATE =================
  const handleSubmit = async (payload: any) => {
    try {
      if (editRow) {
        await editItem(
          editRow.okp_id,
          payload,
          ApiEndpoint.knowledge_profile.update,
        );
      } else {
        await addItem(payload, ApiEndpoint.knowledge_profile.create);
      }
      setOpenForm(false);
      setEditRow(null);
      refetch();
    } catch {
      // Errors handled by useAxios
    }
  };

  // ================= DELETE =================
  const handleDeleteTrigger = (item: GenericKP) => {
    setConfirmMessage(
      "Are you sure you want to delete this Knowledge Profile?",
    );
    setDeleteTriggerId(item.okp_id);
  };

  const handleDelete = async () => {
    if (!deleteTriggerId) return;

    try {
      const url = `${ApiEndpoint.knowledge_profile.delete || ApiEndpoint.knowledge_profile.update}${deleteTriggerId}`;
      const response: any = await axiosInstance.delete(url);

      if (
        response.data?.status ||
        response.status === 200 ||
        response.status === 204
      ) {
        setKpList((prev) => prev.filter((i) => i.okp_id !== deleteTriggerId));
        toast.success("Knowledge Profile Deleted Successfully");
      }

      setDeleteTriggerId(null);
      refetch();
    } catch (error) {
      toast.error("Deletion Failed");
      console.log(error);
    }
  };

  const onGridReady = (params: any) => {
    setGridApi(params.api);
  };

  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    refetch({ payload: { search: value } });
  };

  // ================= TABLE COLUMNS =================
  const columnDefs = useMemo(() => {
    return [
      {
        headerName: "Sl No.",
        valueGetter: "node.rowIndex + 1",
        width: 80,
        minWidth: 80,
        maxWidth: 80,
        suppressMovable: true,
        sortable: false,
        filter: false,
        cellStyle: { borderRight: "1px solid #e2e8f0", textAlign: "center" },
      },
      {
        headerName: "Attribute Code",
        field: "okp_attr_code",
        sortable: true,
        filter: true,
        flex: 1,
        minWidth: 200,
        cellStyle: { borderRight: "1px solid #e2e8f0" },
      },
      {
        headerName: "Attribute Description",
        field: "okp_attr_description",
        sortable: true,
        filter: true,
        flex: 2,
        minWidth: 300,
        cellStyle: {
          borderRight: "1px solid #e2e8f0",
          whiteSpace: "normal",
          lineHeight: "1.4",
        },
        autoHeight: true,
      },
      {
        headerName: "Action",
        cellRenderer: (params: any) => {
          if (!params || !params.data) return null;
          return (
            <div className="flex space-x-3 justify-center items-center h-full">
              <GoPencil
                size={18}
                onClick={() => {
                  setEditRow(params.data);
                  setOpenForm(true);
                }}
                className="cursor-pointer text-yellow-600"
                title="Edit"
              />
              <MdOutlineDoNotDisturbAlt
                className="cursor-pointer text-red-600"
                size={18}
                title="Delete"
                onClick={() => handleDeleteTrigger(params.data)}
              />
            </div>
          );
        },
        width: 90,
        maxWidth: 100,
        cellStyle: { textAlign: "center" as const },
        filter: false,
        editable: false,
        sortable: false,
      },
    ];
  }, []);

  const displayData = useMemo(() => kpList, [kpList]);

  return (
    <>
      <style>{`
        .ag-body-horizontal-scroll, .ag-body-vertical-scroll { display: none !important; }
        .ag-body-viewport { overflow-x: hidden !important; overflow-y: auto !important; -ms-overflow-style: none !important; scrollbar-width: none !important; }
        .ag-body-viewport::-webkit-scrollbar { display: none !important; }
        .ag-row:hover, .ag-row-selected { background-color: transparent !important; }
      `}</style>

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-end pb-5">
        {/* LEFT - TITLE */}
        <h3 className="text-lg leading-6 font-medium">
          Generic Knowledge and Attribute Profile (KPs)
        </h3>

        {/* RIGHT - ADD + SEARCH */}
        <div className="flex flex-col items-end space-y-3">
          {/* ADD BUTTON */}
          <button
            onClick={() => {
              setEditRow(null);
              setOpenForm(true);
            }}
            className="button-bg px-3 py-1.5 text-sm rounded flex items-center text-white"
          >
            Add
          </button>

          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={onSearchChange}
            className="w-64 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ===== TABLE ===== */}
      <DataTable
        key={kpList.length}
        columnDefs={columnDefs}
        rowData={displayData}
        showAddButton={false}
        addButtonHandler={() => {
          setEditRow(null);
          setOpenForm(true);
        }}
        onGridReady={onGridReady}
        pageSize={pageSize}
      />

      {/* ===== ADD / EDIT MODAL ===== */}
      {openForm && (
        <ModalWithForm
          isOpen={openForm}
          title={
            editRow
              ? "Edit Knowledge and Attitude Profile (KPs)"
              : "Add Knowledge and Attitude Profile (KPs)"
          }
          formFields={GenericKPSchemaFields}
          schema={GenericKPSchema}
          initialValues={editRow || {}}
          onSubmit={handleSubmit}
          onClose={() => {
            setOpenForm(false);
            setEditRow(null);
          }}
          resetbuttonName="Reset"
        />
      )}

      {/* ===== DELETE CONFIRMATION ===== */}
      <ConfirmDialog
        isOpen={deleteTriggerId !== null}
        title="Confirm"
        message={confirmMessage}
        onConfirm={handleDelete}
        onClose={() => setDeleteTriggerId(null)}
      />
    </>
  );
};

export default GenericKPPage;
