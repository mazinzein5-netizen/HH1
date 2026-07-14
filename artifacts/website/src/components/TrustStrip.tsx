import { ShieldCheck, HardDrive, MapPin, Flag } from "lucide-react";

export function TrustStrip() {
  const items = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary mb-3" />,
      title: "GDPR Compliant",
      description: "Built for strict European data protection standards",
    },
    {
      icon: <HardDrive className="h-6 w-6 text-primary mb-3" />,
      title: "On-Device Storage",
      description: "Data lives on your phone, not in the cloud",
    },
    {
      icon: <MapPin className="h-6 w-6 text-primary mb-3" />,
      title: "Irish Company",
      description: "Headquartered and registered in Dublin",
    },
    {
      icon: <Flag className="h-6 w-6 text-primary mb-3" />,
      title: "HSE Safety Standards",
      description: "Aligned with HSE safety standards for patient information",
    },
  ];

  return (
    <section className="py-12 border-y border-border/40 bg-card/30 backdrop-blur-sm">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              {item.icon}
              <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">{item.title}</h4>
              <p className="text-muted-foreground text-xs mt-1 max-w-[200px]">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
