/**
 * 合规文本:用户协议、隐私政策、个人信息收集清单。
 *
 * 文本内容根据本应用「程序员计算器」的实际功能编写:
 *  - 应用为纯本地工具型计算器,所有计算、位图、机器码、进制转换均在本地完成;
 *  - 应用不接入网络通信、不接入任何第三方 SDK、不进行用户身份注册/登录;
 *  - 唯一使用的「第三方组件」是开发框架/运行库(React、Vite、Capacitor、TailwindCSS 等),
 *    这些属于应用打包/渲染基础设施,不主动收集或上传用户个人信息。
 *
 * 注意:
 *  - 应用使用 localStorage 仅存储「是否已同意协议」这一个布尔值,不存储任何计算内容或个人信息;
 *  - 若后续接入新 SDK 或网络能力,需同步更新本文件与清单。
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

export interface LegalDocument {
  title: string;
  version: string;
  updatedAt: string;
  /** 生效时间,与更新时间保持一致 */
  effectiveAt: string;
  /** 公网独立成文的协议页 URL(App 内 WebView 加载,满足合规方案1) */
  url: string;
  intro: string;
  sections: LegalSection[];
}

/** 应用基本信息 */
export const APP_INFO = {
  name: "程序员计算器",
  appNameEn: "Programmer Calculator",
  version: "2.11.4",
  developer: "郑州格一网络科技有限公司",
  contactEmail: "lan0o0@qq.com",
  updateDate: "2026-08-11",
} as const;

/**
 * 公网协议页根地址(GitHub Pages 托管)。
 * 后期更换自有域名时,只需修改此常量,App 内全部入口自动指向新地址。
 */
const LEGAL_BASE_URL = "https://lan0o0.github.io/progcalc/";

/** ============ 用户协议 ============ */
export const USER_AGREEMENT: LegalDocument = {
  title: "用户协议",
  version: "v" + APP_INFO.version,
  updatedAt: APP_INFO.updateDate,
  effectiveAt: APP_INFO.updateDate,
  url: LEGAL_BASE_URL + "user-agreement.html",
  intro:
    "欢迎使用「程序员计算器」(以下简称「本应用」)。本应用由 " +
    APP_INFO.developer +
    " 开发并维护。请在使用前仔细阅读并充分理解本协议各条款。一旦您点击「同意」并开始使用本应用,即视为您已阅读、理解并接受本协议全部内容。若您不同意任何条款,请勿使用本应用。",
  sections: [
    {
      heading: "一、服务内容",
      paragraphs: [
        "本应用为离线工具类应用,提供以下功能:十进制 / 二进制 / 十六进制进制的相互转换、原码 / 反码 / 补码机器码展示、位图查看与位翻转、位运算(AND / OR / XOR / NOT / SHL / SHR / NEG)、算术运算(加 / 减 / 乘 / 除 / 取模)及位长(8 / 16 / 32 / 64)与符号性的灵活配置。",
        "上述全部计算与处理均在您的设备本地完成,本应用不通过任何方式将您的计算数据或操作记录上传到外部服务器。",
      ],
    },
    {
      heading: "二、用户行为规范",
      paragraphs: [
        "您承诺合法、合规地使用本应用,不得利用本应用从事任何违反法律法规或公序良俗的行为。",
        "您理解并同意,本应用提供的计算结果仅供参考,您应自行核对结果的正确性。对于因计算结果误差或误用导致的任何直接或间接损失,开发者不承担责任。",
      ],
    },
    {
      heading: "三、知识产权",
      paragraphs: [
        "本应用的软件代码、界面设计、图标、文案等知识产权归开发者所有,受著作权法及相关法律法规保护。",
        "您不得对本应用进行反编译、反汇编、逆向工程,亦不得复制、修改、分发本应用的源代码或产物,除非获得开发者书面授权或相关开源许可证明确允许。",
      ],
    },
    {
      heading: "四、免责声明",
      paragraphs: [
        "本应用按「现状」提供,开发者不对应用的可用性、准确性、完整性、适用性作任何明示或暗示的担保。",
        "在适用法律允许的最大范围内,开发者不对因使用或无法使用本应用而造成的任何损失(包括但不限于数据丢失、业务中断、利润损失)承担责任。",
      ],
    },
    {
      heading: "五、协议变更",
      paragraphs: [
        "开发者可能根据法律法规变化或应用功能调整修订本协议。修订后的协议将随应用更新一并发布,并在应用内提示。",
        "若您继续使用更新后的应用,即视为您接受修订后的协议;若不同意,请您停止使用并卸载本应用。",
      ],
    },
    {
      heading: "六、联系方式",
      paragraphs: [
        "如对本协议有任何疑问,可通过以下方式联系开发者:",
        "邮箱:" + APP_INFO.contactEmail,
      ],
    },
  ],
};

/** ============ 隐私政策 ============ */
export const PRIVACY_POLICY: LegalDocument = {
  title: "隐私政策",
  version: "v" + APP_INFO.version,
  updatedAt: APP_INFO.updateDate,
  effectiveAt: APP_INFO.updateDate,
  url: LEGAL_BASE_URL + "privacy-policy.html",
  intro:
    "「程序员计算器」(以下简称「本应用」)非常重视用户隐私保护。本政策说明本应用在信息收集、使用、存储与保护方面的实际情况。请在使用前仔细阅读。",
  sections: [
    {
      heading: "一、我们收集哪些信息",
      paragraphs: [
        "本应用的核心计算功能(进制转换、位运算、机器码展示等)完全在本地完成,不要求用户注册或登录,不收集您的姓名、手机号、邮箱、通讯录、相册、短信、通话记录等个人身份信息。",
        "为提供广告服务,本应用集成了友盟SDK,在应用启动时展示开屏广告、在主界面展示浮窗广告。该 SDK 在用户同意《隐私权政策》后初始化,加载广告素材过程中会收集设备信息用于广告投放、反作弊与频率控制。",
        "友盟SDK 收集的个人信息类型包括:设备信息(Android ID / IDFA / IDFV / OAID / OpenUDID / GUID;可选 IMEI / IMSI / ICCID)、网络信息、位置信息(可选)、应用列表(可选)。",
        "上述设备信息由友盟SDK 直接采集并回传至友盟服务器,本应用开发者不接触、不存储、不中转上述数据。友盟SDK 隐私权政策链接:https://www.umeng.com/page/policy。",
        "为记录您已同意本协议,本应用会在浏览器/WebView 的本地存储(localStorage)与原生 SharedPreferences 中写入同意标记。该标记不包含任何个人信息,仅用于避免重复弹窗与合规延迟初始化,且可被您随时通过清除应用数据删除。",
      ],
    },
    {
      heading: "二、我们如何使用信息",
      paragraphs: [
        "本应用核心计算功能不使用您的任何信息,亦不会上传至服务器或与第三方共享。",
        "广告 SDK 收集的设备信息用于:广告投放与定向、广告填充与频次控制、反作弊与流量验证、广告效果统计。上述用途由广告服务方在 SDK 内部完成,本应用不参与数据使用环节。",
        "您在应用中输入的数值、计算表达式、位图操作等所有内容,仅存在于内存中,关闭应用或清除数据后即被销毁,不会上传至任何服务器。",
      ],
    },
    {
      heading: "三、SDK 与第三方组件使用情况",
      paragraphs: [
        "本应用在打包与运行时使用以下开源框架/运行库,这些组件属于应用渲染与打包基础设施,本身不主动收集或上传用户个人信息:",
      ],
      list: [
        "React 18 / React DOM:用户界面渲染框架,MIT License。",
        "Vite 6 + vite-plugin-singlefile:构建工具,把代码打包为单一 HTML 文件,MIT License。",
        "Capacitor 7:用于将 Web 应用打包为 Android 原生壳,MIT License。Capacitor 运行时不主动收集用户信息。",
        "TypeScript / TailwindCSS / PostCSS:开发期语言与样式工具,产物中不含运行时数据收集逻辑。",
        "lucide-react:图标库,ISC License。",
        "zustand:状态管理库,MIT License。",
        "react-router-dom:路由库,MIT License。",
      ],
    },
    {
      heading: "四、第三方广告 SDK 说明",
      paragraphs: [
        "本应用集成了友盟SDK(包含基础组件库 common、asms 与广告联盟 union 模块),用于在应用启动时展示开屏广告、在主界面展示浮窗广告,以维持应用的免费运营。",
        "SDK 名称:友盟SDK。",
        "SDK 提供方:友盟+(北京宏景北雁信息技术有限公司)。",
        "服务类型:广告联盟(开屏广告、浮窗广告)。",
        "收集个人信息类型:设备信息(Android ID / IDFA / IDFV / OAID / OpenUDID / GUID;可选 IMEI / IMSI / ICCID)、网络信息、位置(可选)、应用列表(可选)。",
        "收集目的:广告投放与定向、反作弊、广告效果统计。",
        "数据回传:SDK 直接将上述数据回传至友盟服务器,本应用开发者不接触、不存储、不中转这些数据。",
        "友盟SDK 隐私权政策链接:https://www.umeng.com/page/policy。",
        "权限使用:INTERNET(网络加载广告素材)、ACCESS_NETWORK_STATE(检测网络状态)、READ_PHONE_STATE(读取设备标识用于广告投放与反作弊)、ACCESS_COARSE_LOCATION / ACCESS_FINE_LOCATION(位置定向广告,可在系统设置中关闭)、AD_ID(广告标识符)。",
        "合规延迟初始化:本应用严格遵守友盟合规要求,在用户同意《隐私权政策》后才调用 UMConfigure.submitPolicyGrantResult + UMUnionSdk.init 初始化 SDK,不会在用户同意前采集任何数据。",
        "如您不希望被友盟SDK 收集设备信息,可在系统设置中关闭对应权限,或卸载本应用。",
      ],
    },
    {
      heading: "五、权限使用说明",
      paragraphs: [
        "本应用申请以下系统权限,用途如下:",
        "INTERNET / ACCESS_NETWORK_STATE:加载广告素材与广告 SDK 通信。",
        "READ_PHONE_STATE:广告 SDK 读取设备标识,用于广告投放与反作弊。",
        "ACCESS_COARSE_LOCATION / ACCESS_FINE_LOCATION:广告 SDK 用于地域定向广告。可在系统设置中关闭,不影响核心计算功能。",
        "AD_ID:Android 13+ 广告标识符权限,用于广告归因。",
        "WRITE_EXTERNAL_STORAGE(仅 Android 9 及以下):广告素材缓存。Android 10+ 通过 Scoped Storage 不再需要。",
        "本应用核心计算功能不依赖上述任何权限。即使您关闭所有权限,进制转换、位运算、机器码展示等功能仍可正常使用,仅广告展示会受影响。",
      ],
    },
    {
      heading: "六、信息存储与安全",
      paragraphs: [
        "本应用核心计算数据不在服务器端存储,所有计算与状态均保存在您设备的内存与本地存储中,关闭应用或清除数据后即被销毁。",
        "广告 SDK 收集的设备信息由 SDK 提供方按其隐私政策处理,本应用不参与数据存储环节。建议您阅读 SDK 提供方的隐私政策了解详情。",
        "本地存储的协议同意标记可通过「清除应用数据」或「卸载应用」彻底删除。",
      ],
    },
    {
      heading: "七、未成年人保护",
      paragraphs: [
        "本应用为通用工具类应用,不含任何不适合未成年人使用的内容。广告 SDK 会根据系统广告 ID 设置对未成年人进行保护性广告投放。",
        "若您是未成年人,请在监护人指导下使用并阅读本政策。监护人有权在系统设置中限制广告个性化,或卸载本应用。",
      ],
    },
    {
      heading: "八、您的权利",
      paragraphs: [
        "您有权在系统设置中随时关闭或撤销广告 SDK 申请的权限(如位置、电话状态),关闭后核心计算功能不受影响,仅广告相关功能会受限。",
        "您可在设备系统设置中重置广告标识符(OAID / 广告 ID),以限制广告个性化追踪。",
        "您可通过卸载本应用彻底停止广告 SDK 的数据收集行为。",
      ],
    },
    {
      heading: "九、政策更新",
      paragraphs: [
        "本政策可能随应用功能调整、SDK 变更或法规要求而更新。更新后的政策将随应用一并发布并在应用内提示,您继续使用即视为接受。",
      ],
    },
    {
      heading: "十、联系我们",
      paragraphs: [
        "如对本政策有任何疑问或建议,可通过以下方式联系:",
        "邮箱:" + APP_INFO.contactEmail,
      ],
    },
  ],
};

/** ============ 个人信息收集清单 ============ */
export const PERSONAL_INFO_LIST: LegalDocument = {
  title: "个人信息收集清单",
  version: "v" + APP_INFO.version,
  updatedAt: APP_INFO.updateDate,
  effectiveAt: APP_INFO.updateDate,
  url: LEGAL_BASE_URL + "personal-info-list.html",
  intro:
    "依据《个人信息保护法》《App 违法违规收集使用个人信息行为认定方法》等规定,本清单如实披露「程序员计算器」对个人信息的收集情况。",
  sections: [
    {
      heading: "一、应用自身收集情况",
      paragraphs: [
        "本应用核心计算功能(进制转换、位运算、机器码展示等)完全在本地完成,应用自身不收集您的任何个人信息,具体而言:",
      ],
      list: [
        "不收集用户身份信息(姓名、手机号、身份证号、邮箱等);",
        "不收集通讯录、短信、通话记录;",
        "不收集相册、相机、麦克风数据;",
        "不收集应用使用行为(点击、停留时长、操作路径等);",
        "不收集剪贴板内容;",
        "不收集传感器数据(加速度、陀螺仪等);",
        "您输入的数值、计算表达式、位图操作等所有内容,仅存在于设备内存,关闭应用即销毁。",
      ],
    },
    {
      heading: "二、第三方广告 SDK 收集情况",
      paragraphs: [
        "本应用集成了友盟SDK 用于广告变现。SDK 在用户同意《隐私权政策》后初始化,加载广告素材时会收集以下设备信息,用于广告投放、反作弊与效果统计:",
      ],
      list: [
        "设备信息:Android ID / IDFA / IDFV / OAID / OpenUDID / GUID(用于广告归因与反作弊);可选 IMEI / IMSI / ICCID;",
        "网络信息:IP 地址、网络类型(用于广告加载策略);",
        "位置信息(可选):粗略位置 / 精确位置(用于地域定向广告,可在系统设置中关闭);",
        "应用列表(可选):已安装应用列表(用于广告定向);",
        "广告交互事件:广告展示、点击、关闭事件(用于广告效果统计与计费)。",
      ],
    },
    {
      heading: "三、第三方 SDK 清单",
      paragraphs: [
        "本应用集成的会收集用户个人信息的第三方 SDK 如下:",
      ],
      list: [
        "SDK 名称:友盟SDK。",
        "提供方:友盟+(北京宏景北雁信息技术有限公司)。",
        "服务类型:广告联盟(开屏广告、浮窗广告)。",
        "收集信息:设备信息(Android ID/IDFA/IDFV/OAID/OpenUDID/GUID;可选 IMEI/IMSI/ICCID)、网络信息、位置(可选)、应用列表(可选)。",
        "收集目的:广告投放与定向、广告填充与频次控制、反作弊与流量验证、广告效果统计。",
        "数据回传:SDK 直接将数据回传至友盟服务器,本应用开发者不接触、不存储、不中转。",
        "隐私权政策:https://www.umeng.com/page/policy。",
        "申请权限:INTERNET、ACCESS_NETWORK_STATE、READ_PHONE_STATE、ACCESS_COARSE_LOCATION、ACCESS_FINE_LOCATION、AD_ID、WRITE_EXTERNAL_STORAGE(仅 Android 9 及以下)。",
        "合规延迟初始化:用户同意《隐私权政策》后才初始化 SDK。",
      ],
    },
    {
      heading: "四、本地存储说明",
      paragraphs: [
        "本应用自身在以下位置写入非个人信息数据:",
      ],
      list: [
        "localStorage 键名:progcalc.agreement.accepted,值:true,用途:记录用户已同意用户协议与隐私政策,避免重复弹窗。不包含任何个人信息,可通过清除应用数据删除。",
        "localStorage 键名:progcalc.theme,值:auto/light/dark,用途:记录用户选择的主题模式。不包含个人信息,可通过清除应用数据删除。",
        "SharedPreferences 键名:progcalc / agreement.accepted,值:true,用途:原生层记录用户已同意协议,用于合规延迟初始化广告 SDK。不包含个人信息,可通过清除应用数据删除。",
      ],
    },
    {
      heading: "五、数据传输说明",
      paragraphs: [
        "本应用核心计算功能不向任何服务器传输数据。",
        "广告 SDK(UMUnionSdk)会通过 INTERNET 权限发起网络请求,加载广告素材并回传设备信息至广告服务方服务器。具体传输行为由 SDK 提供方控制,本应用不参与数据传输环节。",
      ],
    },
    {
      heading: "六、用户权利",
      paragraphs: [
        "您有权随时关闭或撤销广告 SDK 申请的权限(如位置、电话状态),关闭后核心计算功能不受影响,仅广告相关功能受限。",
        "您可在系统设置中重置广告标识符(OAID / 广告 ID)限制广告个性化。",
        "您可通过「清除应用数据」清除本地存储的协议同意标记与主题偏好。",
        "您可通过卸载本应用彻底停止广告 SDK 的数据收集行为。",
      ],
    },
    {
      heading: "七、咨询与投诉",
      paragraphs: [
        "如对本清单有任何疑问,可通过以下方式联系:",
        "邮箱:" + APP_INFO.contactEmail,
      ],
    },
  ],
};

/** 用户协议与隐私政策的合并摘要,用于首次启动弹窗 */
export const AGREEMENT_SUMMARY = {
  title: "用户协议与隐私政策",
  intro:
    "欢迎使用「程序员计算器」。在使用本应用前,请您仔细阅读并同意以下协议。点击「同意并继续」表示您已阅读、理解并接受全部条款。",
  highlights: [
    "本应用核心计算功能完全离线,不注册、不登录,您输入的数据仅在本地内存处理,关闭即销毁。",
    "为维持免费运营,本应用集成了第三方广告 SDK(UMUnionSdk),会在启动时展示开屏广告、主界面展示浮窗广告。",
    "广告 SDK 会收集设备标识、网络信息、位置等用于广告投放,详情见隐私政策。",
    "您可在系统设置中关闭广告 SDK 申请的权限,关闭后仅广告受限,核心计算功能不受影响。",
  ],
  docs: [
    { key: "agreement", label: "用户协议" },
    { key: "privacy", label: "隐私政策" },
    { key: "list", label: "个人信息收集清单" },
  ],
} as const;
