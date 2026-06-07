import { Outlet } from "react-router-dom";
import BloomDomainPage from "../pages/ioncudos/configuration/bloomDomain/bloomDomainPage";
import OutcomePage from "../pages/ioncudos/configuration/program/outcomePage";
import BloomLevel from "../pages/ioncudos/configuration/bloomLevel/BloomLevel";
// import MapLevelWeightagePage from "../pages/ioncudos/configuration/mapLevelWeightage/mapLevelWeightagePage";
// import { Bos } from "../pages/ioncudos/configuration/bos";
import ProgramMode from "../pages/ioncudos/configuration/program_mode/ProgramMode";
import MapLevelWeightagePage from "../pages/ioncudos/configuration/mapLevelWeightage/mapLevelWeightagePage";
import Bos from "../pages/ioncudos/configuration/bos/Bos";
import LabCategoryPage from "../pages/ioncudos/configuration/labCategory/labCategoryPage";
import genericKPPage from "../pages/ioncudos/configuration/generickp/genericKPPage";
import CurriculumPage from "../pages/ioncudos/curriculum/curriculum/CurriculumPage";
import CurriculumForm from "../pages/ioncudos/curriculum/curriculum/CurriculumForm";
import PsoPage from "../pages/ioncudos/curriculum/pso";
import CompetenciesAndPIsPage from "../pages/ioncudos/curriculum/competenciesAndPIs/CompetenciesAndPIsPage";
import CourseOutcomePage from "../pages/ioncudos/curriculum/courseOutcome/CourseOutcomePage";

//import AddCoursePage from "../pages/ioncudos/curriculum/course/AddCoursePage";
import PsoFormPage from "../pages/ioncudos/curriculum/pso/PsoFormPage";
import ManageKnowledgeProfile from "../pages/ioncudos/curriculum/manageKnowledgeProfile/ManageKnowledgeProfile";
import PoPeoMappingPage from "../pages/ioncudos/curriculum/poPeoMapping/PoPeoMappingPage";
import CurriculumSettingsPage from "../pages/ioncudos/curriculum/curriculumSettings/CurriculumSettingsPage";
import CourseSpecializationPage from "../pages/ioncudos/curriculum/curriculumSettings/courseSpecialization/CourseSpecialization";
import CiaList from "../pages/ioncudos/assessment/cia/CiaList";
import CceDataImportList from "../pages/ioncudos/attainment/cceDataImport/CceDataImportList";
import CiaQpList from "../pages/ioncudos/assessment/manage_cia_qp_rubrics/CiaQpList";
import CiaQpEditor from "../pages/ioncudos/assessment/manage_cia_qp_rubrics/CiaQpEditor";
import SeeCourseWiseImport from "../pages/ioncudos/attainment/seeCourseWiseImport/SeeCourseWiseImport";
import ManageQuestionTypePage from "../pages/ioncudos/survey/manage-survey-question-type/ManageQuestionTypePage";
import JournalEditorialBoardMemberPage from "../pages/ioncudos/facultyContribution/journalEditorialBoardMember/JournalEditorialBoardMemberPage";
import MemberOfAcademicAdministrativeCocurricularPage from "../pages/ioncudos/facultyContribution/memberOfAcademicAdministrativeCocurricularBodies/MemberOfAcademicAdministrativeCocurricularPage";
import FacultyInternshipTrainingWithIndustryPage from "../pages/ioncudos/facultyContribution/facultyInternshipTrainingWithIndustry/FacultyInternshipTrainingWithIndustryPage";
import eCountentDevelopmentCertificationsPage from "../pages/ioncudos/facultyContribution/eCountentDevelopmentCertifications/eCountentDevelopmentCertificationsPage";
import FacultyReportsProfilePage from "../pages/ioncudos/reports/facultyReportsProfile/FacultyReportsProfilePage";
import FacultyContributionDataPage from "../pages/ioncudos/reports/facultyContributionData/FacultyContributionDataPage";
import DepartmentVisionMissionPage from "../pages/ioncudos/reports/departmentVisionMission/DepartmentVisionMissionPage";
// import DepartmentCurriculumDetailsListPage from "../pages/ioncudos/reports/departmentCurriculumDetailsList/DepartmentCurriculumDetailsListPage";
import FacultyProfilePage from "../pages/ioncudos/facultyContribution/facultyProfile/FacultyProfilePage";
import FacultyWorkLoadPage from "../pages/ioncudos/facultyContribution/facultyWorkLoad/FacultyWorkLoadPage";
import CourseCompletedPage from "../pages/ioncudos/facultyContribution/courseCompleted/CourseCompletedPage";
import ResearchPublicationPage from "../pages/ioncudos/facultyContribution/researchPublication/ResearchPublicationPage";
import SponsoredProjectsPage from "../pages/ioncudos/facultyContribution/sponsoredProjects&CounsultancyWorks/SponsoredProjectsPage";
import PatentInnovationActivitiesPage from "../pages/ioncudos/facultyContribution/patentInnovation&DevelopmentActivities/PatentInnovationActivitiesPage";
import ConsultancyTestingProjectsPage from "../pages/ioncudos/facultyContribution/consultancy&TestingProjects/ConsultancyTestingProjectsPage";
import AwardHonorsPage from "../pages/ioncudos/facultyContribution/award&honors/AwardHonorsPage";
import BookPublishedPage from "../pages/ioncudos/facultyContribution/bookPublished/BookPublishedPage";
import BookChapterPage from "../pages/ioncudos/facultyContribution/bookChapter/BookChapterPage";
import FellowshipScholarshipPage from "../pages/ioncudos/facultyContribution/fellowshipScholarship/FellowshipScholarshipPage";
import ConferenceSeminarWorkshopOrganizedPage from "../pages/ioncudos/facultyContribution/conferenceSeminarWorkshopOrganized/ConferenceSeminarWorkshopOrganizedPage";
import SeminarWorkshopAttendedPage from "../pages/ioncudos/facultyContribution/seminarWorkshopAttended/SeminarWorkshopAttendedPage";
import TechnicalSpecialLectureDeliveredPage from "../pages/ioncudos/facultyContribution/technicalSpecialLectureDelivered/TechnicalSpecialLectureDeliveredPage";
import ResearchProjectPage from "../pages/ioncudos/facultyContribution/researchProjects/ResearchProjectPage";
import ProfesionalBodiesPage from "../pages/ioncudos/facultyContribution/professionalBodies/ProfesionalBodiesPage";
/**
 * IonCUDOS Route Configuration
 * Defines navigation structure and routing for CUDOS module (Outcome-Based Education)
 */

export const CUDOSROUTE = [
  {
    name: "Configuration",
    href: "",
    element: Outlet, // Parent route with nested children
    roles: [],
    subItems: [
      {
        name: "Bloom's Domain",
        href: "/configuration/bloom_domain",
        element: BloomDomainPage,
        roles: [],
      },
      {
        name: "Bloom's Level",
        href: "/configuration/bloom_level",
        element: BloomLevel,
        roles: [],
      },
      {
        name: "Program Outcome (PO) Type",
        href: "/configuration/program_outcome",
        element: OutcomePage,
        roles: [],
      },
      {
        name: "Program Mode",
        href: "/configuration/program_mode",
        element: ProgramMode,
        roles: [],
      },

      {
        name: "Map Level Weightage",
        href: "/configuration/map_level_weightage",
        element: MapLevelWeightagePage,
        roles: [],
      },
      {
        name: "Board of Studies (BoS) Member",
        href: "/configuration/bos",
        element: Bos,
        roles: [],
      },
      {
        name: "Lab Category",
        href: "labCategory",
        element: LabCategoryPage,
        roles: [],
      },
      {
        name: "Generic Knowledge and Attribute Profile (KPs)",
        href: "/configuration/knowledge_profile",
        element: genericKPPage,
        roles: [],
      },
    ],
  },
  {
    name: "Curriculum",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Curriculum",
        href: "/curriculum",
        element: CurriculumPage,
        roles: [],
      },
      {
        name: "", // Hidden
        href: "/curriculum/create",
        element: CurriculumForm,
        roles: [],
      },
      {
        name: "", // Hidden
        href: "/curriculum/edit/:id",
        element: CurriculumForm,
        roles: [],
      },
      // {
      //   name: "", // Hidden
      //   href: "approval_setup",
      // },

      {
        name: "Competencies and PIs",
        href: "/curriculum/competencies_and_pis",
        element: CompetenciesAndPIsPage,
        roles: [],
      },
      {
        name: "Course Outcomes (COs)",
        element: CourseOutcomePage,
        href: "/curriculum/course_outcomes",
        roles: [],
      },
      {
        name: "POs / PSOs",
        href: "program_outcomes",
        element: Outlet,
        roles: [],
        subItems: [
          {
            name: "",
            href: "",
            element: PsoPage,
            roles: [],
          },
          {
            name: "Add PO / PSO",
            href: "create",
            element: PsoFormPage,
            roles: [],
            hidden: true,
          },
          {
            name: "Edit PO / PSO",
            href: "edit/:id",
            element: PsoFormPage,
            roles: [],
            hidden: true,
          },
        ],
      },
      // {
      //   name: "Curriculum Delivery Method",
      //   href: "/curriculum/curriculum_delivery_method",
      //   element: CurriculumDeliveryMethod,
      //   roles: [],
      // },
      {
        name: "Manage Knowledge and Attitude Profile",
        href: "/curriculum/manage_knowledge_profile",
        element: ManageKnowledgeProfile,
        roles: [],
      },
      {
        name: "PO to PEO Mapping",
        href: "/curriculum/po_peo_mapping",
        element: PoPeoMappingPage,
        roles: [],
      },
      {
        name: "Curriculum Settings",
        href: "/curriculum/settings",
        element: CurriculumSettingsPage,
        roles: [],
      },
      {
        name: "",
        href: "/curriculum/course_specialization",
        element: CourseSpecializationPage,
        roles: [],
      },
      {
        name: "Manage CIA Occasions",
        href: "/assessment/manage_cia_occasion",
        element: CiaList,
        roles: [],
      },
      {
        name: "Manage CIA QP & Rubrics",
        href: "/assessment/manage_cia_qp",
        element: CiaQpList,
        roles: [],
      },
      {
        name: "", // Hidden route for editor
        href: "/assessment/manage_cia_qp/edit/:ao_id",
        element: CiaQpEditor,
        roles: [],
      },
    ],
  },
  {
    name: "Attainment",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "CCE Data Entry / Import",
        href: "/attainment/cce_data_import",
        element: CceDataImportList,
        roles: [],
      },
      {
        name: "SEE Data Import",
        href: "/attainment/see_data_import",
        element: SeeCourseWiseImport,
        roles: [],
      },
    ],
  },
  {
    name: "Faculty Contribution",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Faculty Profile",
        href: "/facultyContribution/faculty_profile",
        element: FacultyProfilePage,
        roles: [],
      },
      {
        name: "Faculty Workload",
        href: "/facultyContribution/faculty_workload",
        element: FacultyWorkLoadPage,
        roles: [],
      },
      {
        name: "Course Completed",
        href: "/facultyContribution/course_completed",
        element: CourseCompletedPage,
        roles: [],
      },
      {
        name: "Research Publication",
        href: "/facultyContribution/research_publication",
        element: ResearchPublicationPage,
        roles: [],
      },
      {
        name: "Sponsored Projects & consultancy Work",
        href: "/facultyContribution/sponsored_projects",
        element: SponsoredProjectsPage,
        roles: [],
      },
      {
        name: "Patent,Innovation & Development Activities",
        href: "/facultyContribution/patentInnovation_activities",
        element: PatentInnovationActivitiesPage,
        roles: [],
      },
      {
        name: "Consultancy / Testing Projects",
        href: "/facultyContribution/consultancy_testing_projects",
        element: ConsultancyTestingProjectsPage,
        roles: [],
      },
      {
        name: "Award & Honors",
        href: "/facultyContribution/award_honors",
        element: AwardHonorsPage,
        roles: [],
      },
      {
        name: "Book Published",
        href: "/facultyContribution/book_published",
        element: BookPublishedPage,
        roles: [],
      },
      {
        name: "Book Chapter",
        href: "/facultyContribution/book_chapter",
        element: BookChapterPage,
        roles: [],
      },
      {
        name: "Fellowship / Scholarship",
        href: "/facultyContribution/fellowship_scholarship",
        element: FellowshipScholarshipPage,
        roles: [],
      },
      {
        name: "Conference / Seminar / Training / Development / Workshop Organized",
        href: "/facultyContribution/conference_seminar_workshop_organized",
        element: ConferenceSeminarWorkshopOrganizedPage,
        roles: [],
      },
      {
        name: "Seminar / Training / Development / Workshop Attended",
        href: "/facultyContribution/seminar_workshop_attended",
        element: SeminarWorkshopAttendedPage,
        roles: [],
      },
      {
        name: "Technical talk/special lecture delivered",
        href: "/facultyContribution/technical_special_lecture_delivered",
        element: TechnicalSpecialLectureDeliveredPage,
        roles: [],
      },
      {
        name: "Research Projects",
        href: "/facultyContribution/research_projects",
        element: ResearchProjectPage,
        roles: [],
      },
      {
        name: "Professional Bodies",
        href: "/facultyContribution/professional_bodies",
        element: ProfesionalBodiesPage,
        roles: [],
      },
      {
        name: "Journal Editorial Board Member",
        href: "/facultyContribution/journal_editorial_board_member",
        element: JournalEditorialBoardMemberPage,
        roles: [],
      },
      {
        name: "Member of Academic / Administrative / Cocurricular Bodies",
        href: "/facultyContribution/member_of_academic_administrative_cocurricular_bodies",
        element: MemberOfAcademicAdministrativeCocurricularPage,
        roles: [],
      },
      {
        name: "Faculty Internship/Training/Collaboration with Industry",
        href: "/facultyContribution/faculty_internship_training_with_industry",
        element: FacultyInternshipTrainingWithIndustryPage,
        roles: [],
      },
      {
        name: "E-Countent Development/Certifications (MOOCs through SWAYAM, etc.)",
        href: "/facultyContribution/econtent_development_certifications",
        element: eCountentDevelopmentCertificationsPage,
        roles: [],
      },
    ],
  },
  {
    name: "Survey",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Manage Question Paper Type / Import",
        href: "/survey/manage-survey-question-type",
        element: ManageQuestionTypePage,
        roles: [],
      },
    ],
  },
  {
    name: "Reports",
    href: "",
    element: Outlet,
    roles: [],
    subItems: [
      {
        name: "Faculty Profile",
        href: "/reports/faculty_reports_profile",
        element: FacultyReportsProfilePage,
        roles: [],
      },
      {
        name: "Faculty Contribution Data",
        href: "/reports/faculty_contribution_data",
        element: FacultyContributionDataPage,
        roles: [],
      },
      {
        name: "Department Vision & Mission",
        href: "/reports/department_vision_mission",
        element: DepartmentVisionMissionPage,
        roles: [],
      },
      // {
      //   name: "Department / Curriculum Details List",
      //   href: "/reports/department_curriculum_details_list",
      //   element: DepartmentCurriculumDetailsListPage,
      //   roles: [],
      // },
    ],
  },
];
