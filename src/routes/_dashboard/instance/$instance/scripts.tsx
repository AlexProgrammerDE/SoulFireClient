import { createFileRoute } from "@tanstack/react-router";
import { ConstructionIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import InstancePageLayout from "@/components/nav/instance/instance-page-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card.tsx";

export const Route = createFileRoute("/_dashboard/instance/$instance/scripts")({
  component: InstanceScripts,
});

function InstanceScripts() {
  const { t } = useTranslation("common");
  const { t: tInstance } = useTranslation("instance");

  return (
    <InstancePageLayout
      extraCrumbs={[
        {
          id: "settings",
          content: t("breadcrumbs.settings"),
        },
      ]}
      pageName={t("pageName.instanceScripts")}
    >
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ConstructionIcon className="h-16 w-16 text-muted-foreground" />
          </div>
          <CardTitle>{tInstance("scripts.wipTitle")}</CardTitle>
          <CardDescription>
            {tInstance("scripts.wipDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {tInstance("scripts.wipDetails")}
        </CardContent>
      </Card>
    </InstancePageLayout>
  );
}
