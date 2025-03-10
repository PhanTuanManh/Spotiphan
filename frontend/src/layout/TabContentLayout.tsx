import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface TabContentLayoutProps {
  icon: ReactNode;
  title: string;
  description: string;
  actionComponent?: ReactNode;
  children: ReactNode;
}

const TabContentLayout = ({ icon, title, description, actionComponent, children }: TabContentLayoutProps) => {
  return (
    <Card className="bg-zinc-800/50 border-zinc-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {actionComponent && <div>{actionComponent}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

export default TabContentLayout;
