import React, { useCallback, useMemo, useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { LuPlus } from "react-icons/lu";
import { IoTrashOutline } from "react-icons/io5";
import { FaCheck, FaTimes, FaSync } from "react-icons/fa";
import { useWatch } from "react-hook-form";

import TextInput from "../../../../components/FormBuilder/fields/TextInput";
import Select from "../../../../components/FormBuilder/fields/Select";
import Textarea from "../../../../components/FormBuilder/fields/Textarea";
import Checkbox from "../../../../components/FormBuilder/fields/Checkbox";
import { useAxios } from "../../../../hooks/useAxios";
import axiosInstance from "../../../../utils/api";
import { PsoSchema, MultiPsoSchema } from "./psoSchema";
import { CurriculumOption, PoTypeOption, PsoListByAcademicBatch } from "./responseInterface";

const ApiEndpoint = {
  pso: {
    get_academic_batch_dropdown: "cudos/po/get_academic_batch_dropdown",
    create_po: "cudos/po/po",
    update_po: "cudos/po/po",
    get_po_types: "cudos/po/get_po_type_dropdown",
    get_po: "cudos/po/po",
    get_po_codes: "cudos/generic-program-outcome/po_codes",
  },
};

const PsoFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const passedBatchId = location.state?.academic_batch_id || null;

  const [academicBatchOptions, setAcademicBatchOptions] = useState<CurriculumOption[]>([]);
  const [poTypes, setPoTypes] = useState<PoTypeOption[]>([]);
  const [poCodeOptions, setPoCodeOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [existingPoCodes, setExistingPoCodes] = useState<string[]>([]);
  const [existingStatements, setExistingStatements] = useState<string[]>([]);
  const [hasPo, setHasPo] = useState(false);

  // Axios hooks for dropdowns
  const { responseData: batchData } = useAxios<any, CurriculumOption[]>(
    ApiEndpoint.pso.get_academic_batch_dropdown,
    { method: "get", shouldFetch: true, loader: false }
  );
  const { responseData: typeData } = useAxios<any, PoTypeOption[]>(
    ApiEndpoint.pso.get_po_types,
    { method: "get", shouldFetch: true, loader: false }
  );
  const { responseData: poCodeData } = useAxios<any, any[]>(
    ApiEndpoint.pso.get_po_codes,
    { method: "get", shouldFetch: true, loader: false }
  );

  useEffect(() => {
    if (batchData) setAcademicBatchOptions(batchData);
  }, [batchData]);

  useEffect(() => {
    if (poCodeData && Array.isArray(poCodeData)) {
      const mapped = poCodeData.map((item: any) => ({
        label: item.mt_details_name,
        value: item.mt_details_name,
      }));
      setPoCodeOptions(mapped);
    }
  }, [poCodeData]);

  // useEffect(() => {
  //   if (typeData) setPoTypes(typeData);
  // }, [typeData]);

  useEffect(() => {
    if (typeData) {
      const activePoTypes = typeData.filter(
        (item: any) => item.status === 1
      );

      setPoTypes(activePoTypes);
    }
  }, [typeData]);
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isEdit ? PsoSchema : MultiPsoSchema),
    //defaultValues: isEdit ? {} : { pos: [{ pso_flag: 0 }] },
    defaultValues: isEdit
      ? {}
      : {
        pos: [
          {
            pso_flag: 0,
            academic_batch_id: passedBatchId,
          },
        ],
      },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "pos",
  });

  const watchedPos = useWatch({
    control,
    name: "pos",
  });

  // Load editing data if ID is present
  useEffect(() => {
    const fetchEditingData = async () => {
      if (isEdit && id) {
        setLoading(true);
        try {
          const response = await axiosInstance.get(`${ApiEndpoint.pso.get_po}/${id}`) as any;
          if (response.data && response.data.data) {
            const data = response.data.data as any;

            const key = `${data.po_code}_${data.academic_batch_id}`;
            let kpMapping = data.kp_mapping || "";
            if (!kpMapping) {
              try {
                const saved = sessionStorage.getItem("poPsoSession");
                const poSession = saved ? JSON.parse(saved) : {};
                kpMapping = poSession.mapKp?.[key] || "";
              } catch { }
            }

            const mapped = {
              academic_batch_id: data.academic_batch_id || "",
              po_code: data.po_code || "",
              po_reference: data.po_reference || "",
              po_statement: data.po_statement || "",
              pso_flag: (data.pso_flag === 1 || data.pso_flag === true || data.pso_flag === "1") ? 1 : 0,
              po_type_id: data.po_type_id || "",
              justify: data.justify || data.justification || "",
              state_id: data.state_id ?? 1,
              kp_mapping: kpMapping,
            };

            setEditingData(mapped);
            reset(mapped as any);
          }
        } catch (error) {
          toast.error("Failed to fetch PO/PSO details");
          navigate("/curriculum/program_outcomes");
        } finally {
          setLoading(false);
        }
      }
    };
    fetchEditingData();
  }, [isEdit, id, reset, navigate]);

  const fullForm = useWatch({ control });
  const activeBatchId = isEdit ? (fullForm as any)?.academic_batch_id : ((fullForm as any)?.pos?.[0]?.academic_batch_id || passedBatchId);

  useEffect(() => {
    console.log("activeBatchId changed:", activeBatchId);
    if (!activeBatchId) {
      setExistingPoCodes([]);
      setExistingStatements([]);
      setHasPo(false);
      return;
    }

    axiosInstance
      .post("cudos/po/get_po_pso_by_academic_batch", {
        academic_batch_id: activeBatchId,
      })
      .then((res: any) => {
        console.log("Fetched existing PO/PSO data:", res.data);
        if (res.data?.data?.po_pso) {
          const list = res.data.data.po_pso as any[];
          const codes = list.filter(po => po.state_id !== 0).map(po => po.po_code);
          const statements = list.filter(po => po.state_id !== 0).map(po => po.po_statement);
          console.log("Existing PO Codes:", codes);
          setExistingPoCodes(codes);
          setExistingStatements(statements);
          setHasPo(list.some(po => po.state_id !== 0));
        } else {
          setExistingPoCodes([]);
          setExistingStatements([]);
          setHasPo(false);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch existing PO/PSO data:", err);
        setExistingPoCodes([]);
        setExistingStatements([]);
        setHasPo(false);
      });
  }, [activeBatchId, isEdit, editingData?.academic_batch_id]);

  const onSubmit = async (formData: any) => {
    let userId = 1;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user && user.id) userId = user.id;
    } catch { }

    try {
      const pos = isEdit ? [formData] : (formData.pos || [formData]);

      // Validate Accreditation Type
      // for (const entry of pos) {
      //   try {
      //     const batchRes = await axiosInstance.post("cudos/po/get_po_pso_by_academic_batch", { academic_batch_id: Number(entry.academic_batch_id) });
      //     const poPsoList = (batchRes as any).data?.data?.po_pso || [];
      //     const hasExistingPo = poPsoList.some((po: any) => po.state_id !== 0);

      //     if (!hasExistingPo && (!entry.accreditation_type || entry.accreditation_type === "")) {
      //       toast.error("Accreditation Type is required");
      //       return;
      //     }
      //   } catch (e) {}
      // }

      if (isEdit) {
        const psoFlag = formData.pso_flag === true || formData.pso_flag === 1 ? 1 : 0;
        const updatePayload = {
          po_code: String(formData.po_code).trim().substring(0, 10),
          po_statement: String(formData.po_statement).trim(),
          po_reference: formData.po_reference?.trim() ? formData.po_reference.trim().substring(0, 10) : null,
          po_type_id: formData.po_type_id ? Number(formData.po_type_id) : null,
          academic_batch_id: Number(formData.academic_batch_id),
          state_id: editingData?.state_id ?? 1,
          pso_flag: psoFlag,
          justify: formData.justify?.trim() || null,
          modified_by: userId,
          // Extra fields
          po_minthreshhold: null,
          po_studentthreshhold: null,
          direct_attainment: null,
          indirect_attainment: null,
          extra_curricular: null,
          import_ref_po_id: null,
          crclm_id: null
        };

        // Save custom KP Mapping state
        try {
          const saved = sessionStorage.getItem("poPsoSession");
          const poSession = saved ? JSON.parse(saved) : {};
          poSession.mapKp = poSession.mapKp || {};
          if (formData.kp_mapping) {
            //poSession.mapKp[formData.academic_batch_id] = formData.kp_mapping;
            const key = `${formData.po_code}_${formData.academic_batch_id}`;
            poSession.mapKp[key] = formData.kp_mapping;
            sessionStorage.setItem("poPsoSession", JSON.stringify(poSession));
          }
        } catch { }

        await axiosInstance.put(`${ApiEndpoint.pso.update_po}/${id}`, updatePayload);
        toast.success("Updated successfully");
        navigate("/curriculum/program_outcomes");
      } else {
        const pos = Array.isArray(formData.pos) ? formData.pos : [formData];
        let successCount = 0;

        // Save custom KP Mapping state
        try {
          const saved = sessionStorage.getItem("poPsoSession");
          const poSession = saved ? JSON.parse(saved) : {};
          poSession.mapKp = poSession.mapKp || {};
          for (const entry of pos) {
            if (entry.kp_mapping) {
              //poSession.mapKp[entry.academic_batch_id] = entry.kp_mapping;
              poSession.mapKp = poSession.mapKp || {};

              const key = `${entry.po_code}_${entry.academic_batch_id}`;
              poSession.mapKp[key] = entry.kp_mapping;
            }
          }
          sessionStorage.setItem("poPsoSession", JSON.stringify(poSession));
        } catch { }

        for (const entry of pos) {
          const payload = {
            po_code: String(entry.po_code).trim().substring(0, 10),
            po_statement: String(entry.po_statement).trim(),
            po_reference: entry.po_reference?.trim() ? entry.po_reference.trim().substring(0, 10) : null,
            po_type_id: entry.po_type_id ? Number(entry.po_type_id) : null,
            academic_batch_id: Number(entry.academic_batch_id),
            state_id: 1,
            pso_flag: entry.pso_flag === 1 ? 1 : 0,
            justify: entry.justify?.trim() || null,
            created_by: userId,
            // Add optional fields to satisfy strict backend schema if needed
            po_minthreshhold: null,
            po_studentthreshhold: null,
            direct_attainment: null,
            indirect_attainment: null,
            extra_curricular: null,
            import_ref_po_id: null,
            crclm_id: null
          };

          const res = await axiosInstance.post(ApiEndpoint.pso.create_po, payload);
          if (res.status === 200 || res.status === 201) successCount++;
        }

        if (successCount > 0) {
          toast.success(`Successfully created ${successCount} entries`);
          navigate("/curriculum/program_outcomes");
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save data");
    }
  };


  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <h3 className="text-xl font-bold text-[#4c8491]">
            {isEdit ? "Edit PO / PSO" : "Add Program Outcome (PO) / Program Specific Outcome (PSO)"}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEdit ? "Update details for the selected record" : "Define multiple outcomes in a single manageable form"}
          </p>
        </div>

        <div className="p-4 pt-2">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-3">
              {isEdit ? (
                <div className="p-4 border border-gray-200 rounded-md bg-white">
                  <FieldRenderer
                    prefix=""
                    control={control}
                    errors={errors}
                    academicBatchOptions={academicBatchOptions}
                    poTypes={poTypes}
                    poCodeOptions={poCodeOptions}
                    allSelectedPoCodes={[]}
                    allSelectedStatements={[]}
                    existingPoCodes={existingPoCodes}
                    existingStatements={existingStatements}
                    hasPo={hasPo}
                    currentIndex={0}
                  />
                </div>
              ) : (
                <MultiRowRenderer
                  fields={fields}
                  control={control}
                  errors={errors}
                  academicBatchOptions={academicBatchOptions}
                  poTypes={poTypes}
                  poCodeOptions={poCodeOptions}
                  existingPoCodes={existingPoCodes}
                  existingStatements={existingStatements}
                  hasPo={hasPo}
                  remove={remove}
                />
              )}
            </div>

            <div className="flex flex-row justify-end items-center gap-2 pt-3 border-t border-gray-100">
              {!isEdit && (
                <button
                  type="button"
                  onClick={() =>
                    append({
                      pso_flag: 0,
                      academic_batch_id: passedBatchId,
                    })
                  }
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white button-bg h-9 transition-colors min-w-[120px]"
                >
                  <LuPlus className="mr-2" /> Add More PO
                </button>
              )}

              <button
                onClick={() => reset()}
                type="button"
                className="inline-flex justify-center items-center px-4 h-9 text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-colors min-w-[100px]"
              >
                <FaSync className="mr-2" /> Reset
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white button-bg disabled:opacity-50 h-9 transition-colors min-w-[100px]"
              >
                <FaCheck className="mr-2" /> {isSubmitting ? "Saving..." : (isEdit ? "Update" : "Save")}
              </button>

              <button
                onClick={() => navigate(-1)}
                type="button"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 h-9 transition-colors min-w-[100px]"
              >
                <FaTimes className="mr-2" /> Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Helper component that watches all po_code values and renders rows with filtered options
const MultiRowRenderer: React.FC<{
  fields: any[];
  control: any;
  errors: any;
  academicBatchOptions: CurriculumOption[];
  poTypes: PoTypeOption[];
  poCodeOptions: { label: string; value: string }[];
  existingPoCodes: string[];
  existingStatements: string[];
  hasPo: boolean;
  remove: (index: number) => void;
}> = ({ fields, control, errors, academicBatchOptions, poTypes, poCodeOptions, existingPoCodes, existingStatements, hasPo, remove }) => {
  const watchedPos = useWatch({ control, name: "pos" }) || [];
  const allSelectedPoCodes: string[] = watchedPos.map((row: any) => row?.po_code || "").filter(Boolean);
  const allSelectedStatements: string[] = watchedPos.map((row: any) => row?.po_statement || "").filter(Boolean);

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id} className="p-4 border border-gray-200 rounded-md bg-white relative transition-all">
          {fields.length > 1 && (
            <div className="flex justify-end mb-2 border-b border-gray-50 pb-2">
              <button
                type="button"
                onClick={() => remove(index)}
                className="text-red-500 hover:text-red-700 p-1 flex items-center text-xs font-semibold uppercase tracking-wider"
                title="Remove Entry"
              >
                <IoTrashOutline size={14} className="mr-1" /> Remove Entry
              </button>
            </div>
          )}
          <FieldRenderer
            prefix={`pos.${index}.`}
            control={control}
            errors={(errors.pos as any)?.[index]}
            academicBatchOptions={academicBatchOptions}
            poTypes={poTypes}
            poCodeOptions={poCodeOptions}
            allSelectedPoCodes={allSelectedPoCodes}
            allSelectedStatements={allSelectedStatements}
            existingPoCodes={existingPoCodes}
            existingStatements={existingStatements}
            hasPo={hasPo}
            currentIndex={index}
          />
        </div>
      ))}
    </>
  );
};

const FieldRenderer: React.FC<{
  prefix: string;
  control: any;
  errors: any;
  academicBatchOptions: CurriculumOption[];
  poTypes: PoTypeOption[];
  poCodeOptions: { label: string; value: string }[];
  allSelectedPoCodes: string[];
  allSelectedStatements: string[];
  existingPoCodes: string[];
  existingStatements: string[];
  hasPo: boolean;
  currentIndex: number;
}> = ({ prefix, control, errors, academicBatchOptions, poTypes, poCodeOptions, allSelectedPoCodes, allSelectedStatements, existingPoCodes, existingStatements, hasPo, currentIndex }) => {
  const [accreditationOptions, setAccreditationOptions] = useState<{ label: string, value: any }[]>([]);
  const [kpOptions, setKpOptions] = useState<{ label: string, value: any }[]>([]);
  //const [hasPo, setHasPo] = useState(false);
  //const [existingPoCodes, setExistingPoCodes] = useState<string[]>([]);
  //const [existingStatements, setExistingStatements] = useState<string[]>([]);

  //const selectedBatchId = useWatch({ control, name: `${prefix}academic_batch_id` });

  useEffect(() => {
    // Fetch accreditation options
    axiosInstance.get<any>("cudos/po/get_accreditation_types").then((res: any) => {
      if (res.data?.data) {
        setAccreditationOptions(res.data.data);
      }
    });
  }, []);

  const batchId = useWatch({ control, name: `${prefix}academic_batch_id` });

  useEffect(() => {
    console.log("Using batchId:", batchId);

    if (!batchId) return;

    // 🔹 1. Fetching of existing PO moved to parent PsoFormPage
    // Logic kept here only for KP options

    // 🔹 2. Fetch KP
    axiosInstance
      .post("cudos/po/get_knowledge_profiles", {
        academic_batch_id: batchId,
      })
      .then((res: any) => {
        console.log("KP RESPONSE:", res.data);

        if (res.data?.data) {
          const mappedKp = res.data.data.map((item: any) => ({
            label: item.label,
            value: item.value,
          }));
          setKpOptions(mappedKp);
          sessionStorage.setItem("kpOptions", JSON.stringify(mappedKp));
        } else {
          setKpOptions([]);
        }
      })
      .catch(() => setKpOptions([]));
  }, [batchId]);

  // return (
  // <div className="grid grid-cols-12 gap-x-4 gap-y-2.5 items-start">
  //   <div className="col-span-12 lg:col-span-6">
  //     <Controller
  //       name={`${prefix}academic_batch_id`}
  //       control={control}
  //       render={({ field }) => (
  //         <Select
  //           {...field}
  //           label="Curriculum / Academic Batch"
  //           required
  //           placeholder="Select Curriculum"
  //           error={errors?.academic_batch_id}
  //           options={academicBatchOptions.map(b => ({ label: b.label, value: b.value }))}
  //         />
  //       )}
  //     />
  //   </div>

  //   <div className="col-span-12 lg:col-span-6">
  //     <Controller
  //       name={`${prefix}accreditation_type`}
  //       control={control}
  //       render={({ field }) => (
  //         <Select
  //           {...field}
  //           label="Accreditation Type"
  //           required={!hasPo}
  //           placeholder={hasPo ? "Disabled" : "Select Accreditation Type"}
  //           disabled={hasPo}
  //           options={accreditationOptions}
  //         />
  //       )}
  //     />
  //   </div>

  //   <div className="col-span-12 sm:col-span-6 lg:col-span-3">
  //     <Controller
  //       name={`${prefix}po_code`}
  //       control={control}
  //       render={({ field }) => (
  //         <TextInput
  //           {...field}
  //           label="PO/PSO Code"
  //           required
  //           placeholder="e.g. PSO1"
  //           error={errors?.po_code}
  //         />
  //       )}
  //     />
  //   </div>

  //   <div className="col-span-12 sm:col-span-6 lg:col-span-3">
  //     <Controller
  //       name={`${prefix}po_reference`}
  //       control={control}
  //       render={({ field }) => (
  //         <TextInput
  //           {...field}
  //           label="Reference"
  //           placeholder="e.g. NBA 1"
  //           error={errors?.po_reference}
  //         />
  //       )}
  //     />
  //   </div>

  //   <div className="col-span-12 sm:col-span-6 lg:col-span-3">
  //     <Controller
  //       name={`${prefix}po_type_id`}
  //       control={control}
  //       render={({ field }) => (
  //         <Select
  //           {...field}
  //           label="PO Type"
  //           placeholder="Select PO Type"
  //           error={errors?.po_type_id}
  //           options={poTypes.map(t => ({ label: t.label, value: t.value }))}
  //         />
  //       )}
  //     />
  //   </div>

  //   <div className="col-span-12 lg:col-span-6 flex items-center h-full pt-6">
  //     <Controller
  //       name={`${prefix}pso_flag`}
  //       control={control}
  //       render={({ field: { value, onChange, ...field } }) => (
  //         <Checkbox
  //           {...field}
  //           label="Is Program Specific Outcome (PSO)"
  //           checked={value === 1}
  //           onChange={(e: any) => onChange(e.target.checked ? 1 : 0)}
  //         />
  //       )}
  //     />
  //   </div>

  //   <div className="col-span-12 lg:col-span-6">
  //     <Controller
  //       name={`${prefix}po_statement`}
  //       control={control}
  //       render={({ field }) => (
  //         <Textarea
  //           {...field}
  //           label="PO / PSO Statement"
  //           required
  //           placeholder="Outcome statement..."
  //           error={errors?.po_statement}
  //           rows={3}
  //         />
  //       )}
  //     />
  //   </div>

  //   <div className="col-span-12 lg:col-span-6">
  //     <Controller
  //       name={`${prefix}justify`}
  //       control={control}
  //       render={({ field }) => (
  //         <Textarea
  //           {...field}
  //           label="Justification"
  //           placeholder="Why this outcome?"
  //           error={errors?.justify}
  //           rows={3}
  //         />
  //       )}
  //     />
  //   </div>



  //   <div className="col-span-12 lg:col-span-6">
  //     <Controller
  //       name={`${prefix}kp_mapping`}
  //       control={control}
  //       render={({ field }) => (
  //         <Select
  //           {...field}
  //           label="Map KP"
  //           placeholder="Select KP"
  //           options={kpOptions}
  //         />
  //       )}
  //     />
  //   </div>
  // </div>
  // );
  return (
    <div className="space-y-4">

      <Controller
        name={`${prefix}academic_batch_id`}
        control={control}
        render={({ field }) => <input type="hidden" {...field} value={field.value || ""} />}
      />

      {/* Row 1 → Accreditation */}
      <div className="w-[250px]">
        <Controller
          name={`${prefix}accreditation_type`}
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Accreditation Type"
              required={!hasPo}
              placeholder={" CUSTOM"}
              disabled={true}
              options={accreditationOptions}
            />
          )}
        />
      </div>

      {/* Row 2 → Main Inline Row */}
      <div className="flex flex-wrap items-end gap-4">

        {/* PO Code (DROPDOWN) */}
        <div className="w-[160px]">
          <Controller
            name={`${prefix}po_code`}
            control={control}
            render={({ field }) => {
              const currentValue = field.value || "";
              const filteredOptions = poCodeOptions.filter((opt) => {
                const optionValue = opt.value?.trim().toLowerCase();
                const current = currentValue?.trim().toLowerCase();

                // allow current selected value
                if (optionValue === current) {
                  return true;
                }

                // hide already selected in other rows
                const selectedInAnotherRow = allSelectedPoCodes.some(
                  (code) =>
                    code?.trim().toLowerCase() === optionValue &&
                    code?.trim().toLowerCase() !== current
                );

                // hide already existing in DB
                const existsInCurriculum = existingPoCodes.some(
                  (code) =>
                    code?.trim().toLowerCase() === optionValue &&
                    code?.trim().toLowerCase() !== current
                );

                return !selectedInAnotherRow && !existsInCurriculum;
              });
              return (
                <Select
                  {...field}
                  label="PO Code"
                  required
                  placeholder="Select"
                  error={errors?.po_code}
                  options={filteredOptions}
                />
              );
            }}
          />
        </div>

        {/* Reference */}
        <div className="w-[160px]">
          <Controller
            name={`${prefix}po_reference`}
            control={control}
            render={({ field }) => (
              <TextInput
                {...field}
                label="PO Reference"
                placeholder=""
                error={errors?.po_reference}
              />
            )}
          />
        </div>

        {/* Checkbox */}
        <div className="flex items-center gap-2 pb-2">
          <Controller
            name={`${prefix}pso_flag`}
            control={control}
            render={({ field: { value, onChange, ...field } }) => (
              <Checkbox
                {...field}
                label="PSO Flag"
                checked={value === 1}
                onChange={(e: any) => onChange(e.target.checked ? 1 : 0)}
              />
            )}
          />
        </div>

        {/* PO Type */}
        <div className="w-[200px]">
          <Controller
            name={`${prefix}po_type_id`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="PO Types"
                placeholder="Select"
                options={poTypes.map(t => ({ label: t.label, value: t.value }))}
              />
            )}
          />
        </div>

        {/* KP */}
        <div className="w-[200px]">
          <Controller
            name={`${prefix}kp_mapping`}
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Map KP"
                placeholder="Select"
                options={kpOptions}
              />
            )}
          />
        </div>

      </div>

      {/* Row 3 → Statement */}
      <div className="w-full">
        <Controller
          name={`${prefix}po_statement`}
          control={control}
          rules={{
            validate: (value: string) => {
              if (!value) return "PO Statement is required";
              const val = value.trim().toLowerCase();

              // Check curriculum-wise (existing data)
              // But ignore if it belongs to the record we are currently editing
              const isEditMode = prefix === ""; // or check ID
              const originalStatement = control._defaultValues?.po_statement?.trim().toLowerCase();

              if (existingStatements.some(s => s.trim().toLowerCase() === val)) {
                if (!isEditMode || val !== originalStatement) {
                  return "This statement already exists for this curriculum";
                }
              }

              // Check session-wise (other rows)
              const otherRowsStatements = allSelectedStatements
                .filter((_, idx) => idx !== currentIndex)
                .map(s => s.trim().toLowerCase());

              if (otherRowsStatements.includes(val)) {
                return "This statement is already entered in another row";
              }

              return true;
            }
          }}
          render={({ field, fieldState: { error } }) => (
            <Textarea
              {...field}
              label="PO Statement"
              required
              placeholder=""
              rows={3}
              error={error || errors?.po_statement}
            />
          )}
        />
      </div>

    </div>
  );
};

export default PsoFormPage;