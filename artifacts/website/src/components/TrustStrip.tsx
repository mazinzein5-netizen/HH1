import { ShieldCheck, HardDrive, MapPin, Flag } from "lucide-react";

export function TrustStrip() {
  const items = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary mb-3" />,
      title: "GDPR & DPA 2018",
      description: "Built for GDPR and the Irish Data Protection Act 2018",
    },
    {
      icon: <HardDrive className="h-6 w-6 text-primary mb-3" />,
      title: "Audit-Ready Records",
      description: "Safe digitisation of patient files with auditability by design",
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary mb-3" />,
      title: "Irish Company",
      description: "Headquartered and registered in Dublin, Ireland",
    },
    {
      icon: <Flag className="h-6 w-6 text-primary mb-3" />,
      title: "National Alignment",
      description: "In step with Digital for Care 2024–2030 and the Sláintecare direction",
    },
  ];

  return (
    <section className="py-12 border-y border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {item.icon}
              <p className="font-bold text-foreground text-sm uppercase tracking-wider">{item.title}</p>
              <p className="text-muted-foreground text-xs mt-1 max-w-[200px]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
