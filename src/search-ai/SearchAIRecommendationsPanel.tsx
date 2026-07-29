/**
 * Search AI — Recommendations 2.0 (prototype)
 *
 * Design reference: Figma **Recommendations 2.0** — node `86-40295`
 * https://www.figma.com/design/h2UBW91Ecj9rwQHMJfZHE4/Recommendations-2.0?node-id=86-40295
 */
import { useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { Filter, MoreVertical, CheckCircle2, XCircle } from "lucide-react";
import { MainCanvasViewHeader } from "@/contenthub-ui/MainCanvasViewHeader";
import { Badge } from "@/contenthub-ui/badge";
import { Button } from "@/contenthub-ui/button";
import { AppDataTable } from "@/contenthub-ui/AppDataTable";
import { SearchAIBlogPreviewModal } from "@/search-ai/SearchAIBlogPreviewModal";
import { L1_STRIP_ICON_STROKE_PX } from "@/content-hub/l1StripIconTokens";

export type BlogSection = {
  heading?: string;
  body?: string;
  listItems?: string[];
  image?: string;
  imageAlt?: string;
};

export type SearchAIRecommendation = {
  id: string;
  title: string;
  description: string;
  type: "Blog" | "FAQ" | "Services" | "Photos" | "Google description";
  impact: "High" | "Medium" | "Low";
  aeoScore: number;
  category: string;
  locations: number;
  blogContent?: {
    heroImage: string;
    sections: BlogSection[];
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };
};

const recommendationColumnHelper = createColumnHelper<SearchAIRecommendation>();

export const MOCK_RECOMMENDATIONS: SearchAIRecommendation[] = [
  {
    id: "b1",
    title: "Dubbo Property Market Update 2026: What Buyers, Sellers and Landlords Need to Know",
    description: "Publishing a localised Dubbo property market update positions Raine & Horne as the authoritative local source cited by AI assistants for property queries.",
    type: "Blog",
    impact: "High",
    aeoScore: 91,
    category: "Content",
    locations: 14,
    blogContent: {
      heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80",
      metaTitle: "Dubbo Property Market 2026: Buyer, Seller and Landlord Guide | Raine & Horne",
      metaDescription: "The Dubbo property market in 2026 is showing strong fundamentals for sellers and steady rental demand for landlords. Here's what you need to know before making your next move.",
      slug: "dubbo-property-market-update-2026",
      sections: [
        {
          body: "The Dubbo property market in 2026 continues to attract attention from both local owner-occupiers and interstate investors. With a combination of relative affordability, strong rental demand, and growing regional infrastructure investment, Dubbo remains one of the most active regional real estate markets in New South Wales. Whether you are thinking of selling, buying, or maximising your rental yield, understanding the current conditions is essential before making any decision.",
        },
        {
          heading: "Market Conditions for Sellers in Dubbo",
          body: "Sellers in Dubbo are currently benefiting from a relatively low volume of available listings combined with consistent buyer enquiry. Properties priced correctly and presented well are achieving strong results within 30–45 days of listing.",
          listItems: [
            "Median house prices in Dubbo have held firm with modest growth across most suburbs",
            "Well-presented three and four bedroom homes in South Dubbo and Keswick Estate are attracting multiple offers",
            "Days on market have shortened for properties priced at or below the appraised range",
            "Buyers are increasingly focused on outdoor entertaining, updated kitchens, and proximity to Dubbo schools",
          ],
          image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=900&q=80",
          imageAlt: "For sale sign in front of Dubbo residential property",
        },
        {
          heading: "Rental Market Conditions for Dubbo Landlords",
          body: "Dubbo's rental market remains tight, with vacancy rates below the state average. Landlords with well-maintained properties in sought-after suburbs are achieving competitive weekly rents and experiencing minimal vacancy between tenancies.",
          listItems: [
            "Rental vacancy in Dubbo is currently low, creating strong conditions for landlords seeking new tenants",
            "Three bedroom houses in West Dubbo and Delroy Park are among the highest-demand rental categories",
            "Tenants are willing to pay a premium for properties with modern appliances, air conditioning, and secure parking",
            "Annual rent reviews are advisable to ensure returns keep pace with the current market",
          ],
          image: "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=900&q=80",
          imageAlt: "Residential rental property in Dubbo",
        },
        {
          heading: "Buying in Dubbo in 2026",
          body: "For buyers, Dubbo continues to offer meaningful value relative to major capital cities, while providing strong community amenities, quality schools, and growing employment sectors. First home buyers and investors are both active in the current market.",
          listItems: [
            "Finance pre-approval is essential before inspecting properties — well-priced homes are moving quickly",
            "Suburbs like Grangewood and Brocklehurst offer more affordable entry points for first home buyers",
            "Investors should target properties near Dubbo Base Hospital, the CBD, and established schools for consistent tenancy demand",
            "Request a free property appraisal or buyer consultation to understand current value ranges before making an offer",
          ],
        },
        {
          heading: "Five Things to Do Before Selling Your Dubbo Property",
          body: "Preparation before listing significantly impacts your sale outcome. These are the five highest-return steps Dubbo vendors can take before going to market.",
          listItems: [
            "Book a free appraisal to establish a realistic price range based on current comparable sales in your suburb",
            "Attend to minor maintenance items — fresh paint, repaired fences, and clean gutters make a strong first impression",
            "Declutter and depersonalise the home so buyers can picture themselves living there",
            "Consider professional photography — listings with high-quality images generate significantly more enquiry",
            "Discuss your marketing strategy with your agent, including digital advertising and open home scheduling",
          ],
        },
        {
          heading: "Request a Free Dubbo Property Appraisal",
          body: "Understanding what your property is worth in the current Dubbo market is the best first step — whether you plan to sell, rent, or simply review your asset position. Our team provides free, no-obligation sales and rental appraisals across all Dubbo suburbs and surrounding communities. Get in touch with Raine & Horne Dubbo today to book your appraisal and receive expert local advice you can act on.",
        },
        {
          heading: "Frequently Asked Questions",
          body: "",
        },
        {
          heading: "Is now a good time to sell in Dubbo?",
          body: "Dubbo's current market conditions — low listing volumes, consistent buyer enquiry, and short days-on-market for well-priced homes — are favourable for sellers. A free appraisal with a local agent will give you a clear picture of what your specific property could achieve right now.",
        },
        {
          heading: "How do I know what rent to charge for my Dubbo investment property?",
          body: "A free rental appraisal from Raine & Horne Dubbo compares your property against current listings and recent leasing outcomes in your suburb. We consider size, condition, location, and tenant demand to recommend a competitive weekly rent that minimises vacancy without leaving money on the table.",
        },
        {
          heading: "What are the costs of selling a property in Dubbo?",
          body: "The main costs associated with selling in Dubbo include agent commission, marketing and advertising costs, conveyancing fees, and any required pest or building inspections. Your agent should provide a full cost estimate before you sign a listing agreement — ask for this in writing.",
        },
        {
          heading: "How long does it take to sell a house in Dubbo?",
          body: "Most residential properties in Dubbo sell within 30–60 days of listing when priced correctly and marketed effectively. Properties that are overpriced or poorly presented tend to sit on the market longer, which can negatively affect buyer perception. An honest appraisal and strong marketing plan are the most important factors.",
        },
        {
          heading: "What does a property manager do and is it worth the cost?",
          body: "A professional property manager handles all aspects of renting your property — from tenant sourcing and lease preparation to rent collection, inspections, maintenance, and compliance with NSW legislation. For most Dubbo landlords, the cost of professional management is far outweighed by the time saved, reduced vacancy, and risk mitigation it provides.",
        },
      ],
    },
  },
  {
    id: "b2",
    title: "Dubbo Landlord Guide: How Professional Property Management Protects Your Investment",
    description: "A comprehensive property management guide builds trust with Dubbo landlords researching rental services and positions Raine & Horne as the expert cited by AI assistants.",
    type: "Blog",
    impact: "High",
    aeoScore: 87,
    category: "Content",
    locations: 14,
    blogContent: {
      heroImage: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=900&q=80",
      metaTitle: "Dubbo Property Management Guide for Landlords | Raine & Horne",
      metaDescription: "Everything Dubbo landlords need to know about professional property management — from fees and tenant selection to maintenance, inspections, and switching managers.",
      slug: "dubbo-property-management-landlord-guide",
      sections: [
        {
          body: "Owning a rental property in Dubbo can be a rewarding long-term investment — but managing it well requires consistent attention, local knowledge, and familiarity with NSW tenancy legislation. For many landlords, engaging a professional property manager is the smartest decision they make. This guide covers everything you need to know about property management in Dubbo, from what the service includes to how to choose the right manager for your investment.",
        },
        {
          heading: "What Does Professional Property Management Include?",
          body: "A full-service property management agreement with Raine & Horne Dubbo covers every aspect of managing your rental, so you don't have to.",
          listItems: [
            "Tenant sourcing — listing on major rental platforms, conducting open inspections, and managing enquiries",
            "Tenant screening — reference and employment checks, rental history verification, and identity confirmation",
            "Lease preparation — drafting tenancy agreements that comply with current NSW Fair Trading requirements",
            "Rent collection and disbursement — collecting rent and transferring funds to your account with a monthly statement",
            "Routine inspections — photographed reports every 3–6 months so you know your property is being cared for",
            "Maintenance coordination — receiving tenant requests, obtaining owner approval, and managing qualified local trades",
            "End-of-tenancy — final inspections, bond claims, and transition to the next tenancy",
          ],
          image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=900&q=80",
          imageAlt: "Property manager conducting inspection in Dubbo rental",
        },
        {
          heading: "Understanding Property Management Fees in Dubbo",
          body: "Property management fees in Dubbo typically include a management percentage of weekly rent plus a letting fee when a new tenant is placed. Transparency is important — ask any prospective manager to provide a complete written fee schedule before signing.",
          listItems: [
            "Management fee — a percentage of the weekly rent, charged each rental period",
            "Letting fee — charged when a new tenancy is established, typically equivalent to one to two weeks rent",
            "Lease renewal fee — charged when an existing tenant signs a new lease term",
            "Maintenance coordination — some managers charge a fee on top of trade invoices for organising repairs",
            "Disbursement fees — some managers charge for processing payment runs and issuing statements",
          ],
          image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=900&q=80",
          imageAlt: "Reviewing property management documents",
        },
        {
          heading: "How to Choose the Right Property Manager in Dubbo",
          body: "Not all property managers offer the same level of service. These are the questions to ask when selecting a manager for your Dubbo investment property.",
          listItems: [
            "How many properties does each property manager in your team look after? Lower portfolios mean more attention to your property",
            "How do you handle maintenance requests, and what is your approval process for repairs?",
            "How often do you conduct routine inspections, and will I receive written reports with photos?",
            "What is your average vacancy rate and how quickly do you typically re-let properties in my suburb?",
            "Can I see a sample management agreement and fee schedule before committing?",
          ],
        },
        {
          heading: "How to Switch Property Managers in Dubbo",
          body: "Switching property managers is more straightforward than most landlords expect. If you are unhappy with your current management service, you are entitled to give notice in accordance with your management agreement — usually 30 to 90 days.",
        },
        {
          heading: "Start With a Free Rental Appraisal",
          body: "If you own a rental property in Dubbo and want to know whether you're achieving the right rent, or whether your current manager is delivering value, start with a free rental appraisal from Raine & Horne Dubbo. We'll provide an honest assessment of your property's rental potential and explain exactly what our management service includes — with no obligation to sign up.",
        },
      ],
    },
  },
];

const FILTER_CHIPS = ["All", "High impact", "Medium impact", "Low impact"] as const;

function impactVariant(impact: SearchAIRecommendation["impact"]): "default" | "secondary" | "outline" {
  if (impact === "High") return "default";
  if (impact === "Medium") return "secondary";
  return "outline";
}

export function SearchAIRecommendationsPanel() {
  const [previewRec, setPreviewRec] = useState<SearchAIRecommendation | null>(null);

  const columns = useMemo(
    () => [
      recommendationColumnHelper.accessor("title", {
        id: "recommendation",
        header: "Recommendations",
        meta: { settingsLabel: "Recommendations" },
        size: 280,
        enableSorting: true,
        cell: ({ row }) => {
          const rec = row.original;
          return (
            <div className="flex flex-col gap-1">
              <span className="text-muted-foreground">{rec.category}</span>
              <span className="text-foreground">{rec.title}</span>
            </div>
          );
        },
      }),
      recommendationColumnHelper.accessor("type", {
        id: "type",
        header: "Type",
        meta: { settingsLabel: "Type" },
        size: 100,
        enableSorting: true,
        cell: (info) => (
          <Badge variant="outline" className="text-[11px]">
            {info.getValue()}
          </Badge>
        ),
      }),
      recommendationColumnHelper.accessor("impact", {
        id: "impact",
        header: "Impact",
        meta: { settingsLabel: "Impact" },
        size: 120,
        enableSorting: true,
        cell: (info) => {
          const impact = info.getValue();
          return (
            <Badge
              variant={impact === "High" ? "destructive" : "secondary"}
              className={
                impact === "High"
                  ? "border-red-100 bg-red-50 text-[length:var(--font-size)] text-red-600 hover:bg-red-50"
                  : "text-[length:var(--font-size)]"
              }
            >
              {impact}
            </Badge>
          );
        },
      }),
      recommendationColumnHelper.accessor("locations", {
        id: "locations",
        header: "Locations",
        meta: { settingsLabel: "Locations" },
        size: 100,
        enableSorting: true,
        cell: (info) => <span className="text-foreground">{info.getValue()}</span>,
      }),
      recommendationColumnHelper.display({
        id: "actions",
        header: "",
        meta: { settingsLabel: "Actions" },
        size: 160,
        enableSorting: false,
        enableResizing: false,
        enableHiding: false,
        cell: ({ row }) => {
          const rec = row.original;
          return (
            <div className="flex items-center gap-2">
              {rec.type === "Blog" && rec.blogContent && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewRec(rec);
                  }}
                >
                  Preview blog
                </Button>
              )}
              <Button variant="ghost" size="icon" className="size-[34px] shrink-0 text-muted-foreground">
                <MoreVertical size={16} strokeWidth={L1_STRIP_ICON_STROKE_PX} absoluteStrokeWidth />
              </Button>
            </div>
          );
        },
      }),
    ],
    [],
  );

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background">
      <MainCanvasViewHeader
        title="AI recommendations"
        description="Enhance your business's search ranking with AI-driven recommendations and one-click optimization"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <MoreVertical size={16} strokeWidth={L1_STRIP_ICON_STROKE_PX} absoluteStrokeWidth />
            </Button>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter size={16} strokeWidth={L1_STRIP_ICON_STROKE_PX} absoluteStrokeWidth />
            </Button>
          </div>
        }
      />

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-6 pb-8 pt-6">
        <div className="mx-auto flex w-full flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bg-primary/5 dark:bg-primary/10 flex h-[104px] flex-col justify-between rounded-xl p-6">
              <span className="text-3xl tabular-nums text-foreground">2</span>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary" />
                <span className="text-xs text-foreground">Pending</span>
              </div>
            </div>

            <div className="bg-card flex h-[104px] flex-col justify-between rounded-xl border border-border p-6">
              <span className="text-3xl tabular-nums text-foreground">0</span>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={12} strokeWidth={L1_STRIP_ICON_STROKE_PX} absoluteStrokeWidth className="text-primary" />
                <span className="text-xs text-foreground">Accepted</span>
              </div>
            </div>

            <div className="bg-card flex h-[104px] flex-col justify-between rounded-xl border border-border p-6">
              <span className="text-3xl tabular-nums text-foreground">0</span>
              <div className="flex items-center gap-2">
                <XCircle size={12} strokeWidth={L1_STRIP_ICON_STROKE_PX} absoluteStrokeWidth className="text-muted-foreground" />
                <span className="text-xs text-foreground">Rejected</span>
              </div>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden">
            <AppDataTable<SearchAIRecommendation>
              tableId="searchai.recommendations"
              data={MOCK_RECOMMENDATIONS}
              columns={columns as any}
              initialSorting={[{ id: "recommendation", desc: false }]}
              getRowId={(r) => r.id}
              columnSheetTitle="Recommendation columns"
              className="min-w-0 px-0"
              hideColumnsButton
            />
          </div>
        </div>
      </div>

      <SearchAIBlogPreviewModal
        rec={previewRec}
        open={previewRec !== null}
        onClose={() => setPreviewRec(null)}
      />
    </div>
  );
}
