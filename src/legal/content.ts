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
  intro: string;
  sections: LegalSection[];
}

/** 应用基本信息 */
export const APP_INFO = {
  name: "程序员计算器",
  appNameEn: "Programmer Calculator",
  version: "2.9.0",
  developer: "郑州格一网络科技有限公司",
  contactEmail: "lan0o0@qq.com",
  updateDate: "2026-08-07",
} as const;

/** ============ 用户协议 ============ */
export const USER_AGREEMENT: LegalDocument = {
  title: "用户协议",
  version: "v1.0.0",
  updatedAt: APP_INFO.updateDate,
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
  version: "v1.0.0",
  updatedAt: APP_INFO.updateDate,
  intro:
    "「程序员计算器」(以下简称「本应用」)非常重视用户隐私保护。本政策说明本应用在信息收集、使用、存储与保护方面的实际情况。请在使用前仔细阅读。",
  sections: [
    {
      heading: "一、我们收集哪些信息",
      paragraphs: [
        "本应用为完全离线的本地工具型应用,不要求用户注册或登录,不收集您的姓名、手机号、邮箱、设备标识符(IMEI / OAID / IDFA / MAC / Android ID 等)、位置信息、通讯录、相册、短信、通话记录等任何个人身份信息。",
        "本应用不接入任何广告 SDK、统计 SDK、推送 SDK、登录 SDK 或其他会主动收集用户信息的第三方服务。",
        "为记录您已同意本协议,本应用会在浏览器/WebView 的本地存储(localStorage)中写入一个布尔标记(键名:progcalc.agreement.accepted,值:true)。该标记不包含任何个人信息,仅用于避免重复弹窗,且可被您随时通过清除应用数据删除。",
      ],
    },
    {
      heading: "二、我们如何使用信息",
      paragraphs: [
        "本应用不在本地存储之外使用您的任何信息,亦不会将任何信息上传至服务器或与第三方共享。",
        "您在应用中输入的数值、计算表达式、位图操作等所有内容,仅存在于内存中,关闭应用或清除数据后即被销毁。",
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
      heading: "四、权限使用说明",
      paragraphs: [
        "本应用运行时不申请任何敏感系统权限(不申请网络、位置、通讯录、存储、相机、麦克风、电话等权限)。",
        "若您安装的 APK 包同时存在其他权限声明,通常来自 Capacitor 框架默认 manifest,本应用业务代码不会调用这些权限对应的功能。",
      ],
    },
    {
      heading: "五、信息存储与安全",
      paragraphs: [
        "本应用不在服务器端存储任何用户数据,所有计算与状态均保存在您设备的内存与本地存储中。",
        "由于不发生数据传输,因此不存在网络传输层面的数据泄露风险。本地存储的协议同意标记可通过「清除应用数据」或「卸载应用」彻底删除。",
      ],
    },
    {
      heading: "六、未成年人保护",
      paragraphs: [
        "本应用为通用工具类应用,不含任何不适合未成年人使用的内容。若您是未成年人,请在监护人指导下使用并阅读本政策。",
      ],
    },
    {
      heading: "七、政策更新",
      paragraphs: [
        "本政策可能随应用功能调整或法规要求而更新。更新后的政策将随应用一并发布并在应用内提示,您继续使用即视为接受。",
      ],
    },
    {
      heading: "八、联系我们",
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
  version: "v1.0.0",
  updatedAt: APP_INFO.updateDate,
  intro:
    "依据《个人信息保护法》《App 违法违规收集使用个人信息行为认定方法》等规定,本清单如实披露「程序员计算器」对个人信息的收集情况。",
  sections: [
    {
      heading: "一、个人信息收集情况",
      paragraphs: [
        "本应用不收集任何个人信息。具体而言:",
      ],
      list: [
        "不收集用户身份信息(姓名、手机号、身份证号、邮箱等);",
        "不收集设备标识信息(IMEI、OAID、IDFA、MAC、Android ID、序列号等);",
        "不收集位置信息(GPS、基站、Wi-Fi 列表等);",
        "不收集通讯录、短信、通话记录;",
        "不收集相册、相机、麦克风数据;",
        "不收集应用使用行为(点击、停留时长、操作路径等);",
        "不收集剪贴板内容;",
        "不收集传感器数据(加速度、陀螺仪等)。",
      ],
    },
    {
      heading: "二、本地存储说明",
      paragraphs: [
        "本应用仅在浏览器/WebView 的 localStorage 中写入以下数据:",
      ],
      list: [
        "键名:progcalc.agreement.accepted,值:true,用途:记录用户已同意用户协议与隐私政策,避免重复弹窗。不包含任何个人信息,可通过清除应用数据删除。",
      ],
    },
    {
      heading: "三、第三方 SDK 清单",
      paragraphs: [
        "本应用未集成任何会收集用户个人信息的第三方 SDK。所使用的开源框架(React、Vite、Capacitor、TailwindCSS、zustand、lucide-react、react-router-dom 等)均为开发与渲染基础设施,不在运行时主动收集或上传用户个人信息。",
      ],
    },
    {
      heading: "四、数据传输说明",
      paragraphs: [
        "本应用不向任何服务器传输数据。应用不申请网络权限,亦不发起任何网络请求。",
      ],
    },
    {
      heading: "五、用户权利",
      paragraphs: [
        "由于本应用不收集您的个人信息,因此无需进行信息删除、更正、导出等操作。若您希望清除本地存储的协议同意标记,可在系统设置中执行「清除应用数据」或直接卸载应用。",
      ],
    },
    {
      heading: "六、咨询与投诉",
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
    "本应用为完全离线的本地工具,不联网、不注册、不登录。",
    "不收集您的任何个人信息(不含设备标识、位置、通讯录等)。",
    "不接入任何广告、统计、推送或登录类第三方 SDK。",
    "您输入的所有数值与计算仅在本地内存中处理,关闭即销毁。",
    "本地仅存储「已同意协议」一个布尔标记,可随时清除。",
  ],
  docs: [
    { key: "agreement", label: "用户协议" },
    { key: "privacy", label: "隐私政策" },
    { key: "list", label: "个人信息收集清单" },
  ],
} as const;
