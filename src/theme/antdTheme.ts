import type { ThemeConfig } from "antd";
import {
  BRAND,
  BRAND_INK,
  BRAND_TINT,
  CANVAS,
  CONTROL_HEIGHT,
  INK,
  INK_2,
  INK_3,
  LINE,
  LINE_SOFT,
  ON_BRAND,
  RADIUS,
  ROW_HOVER,
  SURFACE,
  TABLE_HEAD,
  TONES,
} from "./tokens";

/**
 * The admin console's one antd theme (promoted from the Safety Monitoring theme, which was the reference).
 * Primary is the brand cyan with DARK text on it (white on #09BAEE is 2.27:1); cyan used as text or a link is
 * the AA-safe brand ink; 40px controls (32 for dense row actions), 12px control radius, Poppins everywhere,
 * semantic colours that pass AA on their tints, calm table headers and no antd drop shadows on buttons.
 */
export const ADMIN_THEME: ThemeConfig = {
  token: {
    fontFamily: "Poppins, sans-serif",
    fontSize: 14,
    fontSizeSM: 12,

    colorPrimary: BRAND,
    colorLink: BRAND_INK,
    colorLinkHover: BRAND,
    colorLinkActive: BRAND_INK,
    colorInfo: BRAND_INK,
    colorSuccess: TONES.success.fg,
    colorWarning: TONES.warning.fg,
    colorError: TONES.danger.fg,

    colorText: INK,
    colorTextBase: INK,
    colorTextSecondary: INK_2,
    colorTextTertiary: INK_3,
    colorTextDescription: INK_3,
    colorTextPlaceholder: INK_3,
    colorTextHeading: INK,
    colorTextLabel: INK_2,

    colorBorder: LINE,
    colorBorderSecondary: LINE_SOFT,
    colorSplit: LINE_SOFT,
    colorBgLayout: CANVAS,
    colorBgContainer: SURFACE,

    borderRadius: RADIUS.control,
    borderRadiusSM: RADIUS.controlSm,
    borderRadiusXS: RADIUS.tag,
    borderRadiusLG: RADIUS.card,

    controlHeight: CONTROL_HEIGHT.md,
    controlHeightSM: CONTROL_HEIGHT.sm,
    controlHeightLG: CONTROL_HEIGHT.lg,
  },
  components: {
    Button: {
      primaryColor: ON_BRAND,
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      fontWeight: 500,
      defaultBorderColor: LINE,
      defaultColor: INK,
      defaultHoverColor: BRAND_INK,
      defaultHoverBorderColor: BRAND_INK,
      defaultActiveColor: BRAND_INK,
      defaultActiveBorderColor: BRAND_INK,
      // Row actions use size="small": 32px high, 8px radius.
      paddingInlineSM: 12,
    },
    Table: {
      headerBg: TABLE_HEAD,
      headerColor: "#374151",
      headerSplitColor: "transparent",
      headerSortActiveBg: "#F1F5F9",
      headerSortHoverBg: "#F1F5F9",
      // antd shades a whole sorted column; it reads as a rendering glitch (ADM-UI-24).
      bodySortBg: "transparent",
      rowHoverBg: ROW_HOVER,
      rowSelectedBg: BRAND_TINT,
      rowSelectedHoverBg: "#D2F0FB",
      borderColor: LINE_SOFT,
      cellPaddingBlock: 17,
      cellPaddingInline: 16,
      cellFontSize: 14,
      headerBorderRadius: 0,
    },
    Pagination: { itemActiveBg: BRAND_TINT, itemSize: 36, itemSizeSM: 28 },
    Tabs: {
      itemColor: INK_2,
      itemHoverColor: BRAND_INK,
      itemSelectedColor: BRAND_INK,
      itemActiveColor: BRAND_INK,
      inkBarColor: BRAND,
      titleFontSize: 14,
    },
    // Switches and segmented views are small UI parts: they take the brand ink so the "on" state and the
    // selected segment stay >= 3:1 against white (the bare cyan is 2.27:1).
    Switch: { colorPrimary: BRAND_INK, colorPrimaryHover: BRAND_INK },
    Segmented: {
      trackBg: LINE_SOFT,
      itemColor: INK_2,
      itemHoverColor: INK,
      itemSelectedBg: SURFACE,
      itemSelectedColor: BRAND_INK,
    },
    Select: { optionSelectedBg: BRAND_TINT, optionSelectedColor: INK, optionSelectedFontWeight: 500 },
    Input: { activeShadow: "0 0 0 2px rgba(9,186,238,0.2)" },
    Tag: { defaultBg: TONES.neutral.bg, defaultColor: TONES.neutral.fg },
    Modal: { borderRadiusLG: RADIUS.modal },
    Alert: { borderRadiusLG: RADIUS.control },
    Steps: { colorPrimary: BRAND_INK },
    Progress: { defaultColor: BRAND_INK },
  },
};
