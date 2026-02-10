import i18n from "@/lib/i18n";

const t = (key: string) => i18n.t(`common:dataTable.${key}`);

export type DataTableConfig = typeof dataTableConfig;

export const dataTableConfig = {
  textOperators: [
    {
      get label() {
        return t("operators.iLike");
      },
      value: "iLike" as const,
    },
    {
      get label() {
        return t("operators.notILike");
      },
      value: "notILike" as const,
    },
    {
      get label() {
        return t("operators.eq");
      },
      value: "eq" as const,
    },
    {
      get label() {
        return t("operators.ne");
      },
      value: "ne" as const,
    },
    {
      get label() {
        return t("operators.isEmpty");
      },
      value: "isEmpty" as const,
    },
    {
      get label() {
        return t("operators.isNotEmpty");
      },
      value: "isNotEmpty" as const,
    },
  ],
  numericOperators: [
    {
      get label() {
        return t("operators.eq");
      },
      value: "eq" as const,
    },
    {
      get label() {
        return t("operators.ne");
      },
      value: "ne" as const,
    },
    {
      get label() {
        return t("operators.lt");
      },
      value: "lt" as const,
    },
    {
      get label() {
        return t("operators.lte");
      },
      value: "lte" as const,
    },
    {
      get label() {
        return t("operators.gt");
      },
      value: "gt" as const,
    },
    {
      get label() {
        return t("operators.gte");
      },
      value: "gte" as const,
    },
    {
      get label() {
        return t("operators.isBetween");
      },
      value: "isBetween" as const,
    },
    {
      get label() {
        return t("operators.isEmpty");
      },
      value: "isEmpty" as const,
    },
    {
      get label() {
        return t("operators.isNotEmpty");
      },
      value: "isNotEmpty" as const,
    },
  ],
  dateOperators: [
    {
      get label() {
        return t("operators.eq");
      },
      value: "eq" as const,
    },
    {
      get label() {
        return t("operators.ne");
      },
      value: "ne" as const,
    },
    {
      get label() {
        return t("operators.ltDate");
      },
      value: "lt" as const,
    },
    {
      get label() {
        return t("operators.gtDate");
      },
      value: "gt" as const,
    },
    {
      get label() {
        return t("operators.lteDate");
      },
      value: "lte" as const,
    },
    {
      get label() {
        return t("operators.gteDate");
      },
      value: "gte" as const,
    },
    {
      get label() {
        return t("operators.isBetween");
      },
      value: "isBetween" as const,
    },
    {
      get label() {
        return t("operators.isRelativeToToday");
      },
      value: "isRelativeToToday" as const,
    },
    {
      get label() {
        return t("operators.isEmpty");
      },
      value: "isEmpty" as const,
    },
    {
      get label() {
        return t("operators.isNotEmpty");
      },
      value: "isNotEmpty" as const,
    },
  ],
  selectOperators: [
    {
      get label() {
        return t("operators.eq");
      },
      value: "eq" as const,
    },
    {
      get label() {
        return t("operators.ne");
      },
      value: "ne" as const,
    },
    {
      get label() {
        return t("operators.isEmpty");
      },
      value: "isEmpty" as const,
    },
    {
      get label() {
        return t("operators.isNotEmpty");
      },
      value: "isNotEmpty" as const,
    },
  ],
  multiSelectOperators: [
    {
      get label() {
        return t("operators.inArray");
      },
      value: "inArray" as const,
    },
    {
      get label() {
        return t("operators.notInArray");
      },
      value: "notInArray" as const,
    },
    {
      get label() {
        return t("operators.isEmpty");
      },
      value: "isEmpty" as const,
    },
    {
      get label() {
        return t("operators.isNotEmpty");
      },
      value: "isNotEmpty" as const,
    },
  ],
  booleanOperators: [
    {
      get label() {
        return t("operators.eq");
      },
      value: "eq" as const,
    },
    {
      get label() {
        return t("operators.ne");
      },
      value: "ne" as const,
    },
  ],
  sortOrders: [
    {
      get label() {
        return t("sortOrders.asc");
      },
      value: "asc" as const,
    },
    {
      get label() {
        return t("sortOrders.desc");
      },
      value: "desc" as const,
    },
  ],
  filterVariants: [
    "text",
    "number",
    "range",
    "date",
    "dateRange",
    "boolean",
    "select",
    "multiSelect",
  ] as const,
  operators: [
    "iLike",
    "notILike",
    "eq",
    "ne",
    "inArray",
    "notInArray",
    "isEmpty",
    "isNotEmpty",
    "lt",
    "lte",
    "gt",
    "gte",
    "isBetween",
    "isRelativeToToday",
  ] as const,
  joinOperators: ["and", "or"] as const,
};
