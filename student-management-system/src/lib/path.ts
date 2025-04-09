export const PATHS = {
  /** ************* SITE ****************** */
  SITE_HOME: "/",
  /** ************* AUTH ****************** */
  AUTH_SIGN_IN: "/auth",
  AUTH_REGISTER: "/register",
  /** ************* FEATURES ****************** */
  STUDENTS: "/students",
  COURSES: "/courses",
  EXAMS: "/exams",
  HOMEWORKS: "/homeworks",
  ANALYSIS: "/analysis",
};

export const PATHS_MAP: Record<string, string> = {
  /** ************* SITE ****************** */
  [PATHS.SITE_HOME]: "首页",
  /** ************* AUTH ****************** */
  [PATHS.AUTH_SIGN_IN]: "登录",
  [PATHS.AUTH_REGISTER]: "注册",
  /** ************* FEATURES ****************** */
  [PATHS.STUDENTS]: "学生管理",
  [PATHS.COURSES]: "课程管理",
  [PATHS.EXAMS]: "试卷管理",
  [PATHS.HOMEWORKS]: "作业管理",
  [PATHS.ANALYSIS]: "成绩分析",
};

export const PATH_DESCRIPTION_MAP: Record<string, string> = {
  /** ************* SITE ****************** */
  [PATHS.SITE_HOME]: "首页",
  /** ************* AUTH ****************** */
  [PATHS.AUTH_SIGN_IN]: "登录",
  [PATHS.AUTH_REGISTER]: "注册",
  /** ************* FEATURES ****************** */
  [PATHS.STUDENTS]: "管理学生信息",
  [PATHS.COURSES]: "管理课程信息",
  [PATHS.EXAMS]: "管理试卷信息",
  [PATHS.HOMEWORKS]: "管理作业信息",
  [PATHS.ANALYSIS]: "分析学生成绩",
};
