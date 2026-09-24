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
    title: "5 Signs You Should See a Dentist Before It Gets Worse",
    description: "Publishing a patient-education blog on warning signs positions Smile Dental as the authoritative local source cited by AI assistants for oral health queries.",
    type: "Blog",
    impact: "High",
    aeoScore: 91,
    category: "Content",
    locations: 10,
    blogContent: {
      heroImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&q=80",
      metaTitle: "5 Signs You Should See a Dentist | Smile Dental Group",
      metaDescription: "Tooth sensitivity, bleeding gums, and persistent bad breath are early warning signs that shouldn't be ignored. Learn the five signals that mean it's time to book a dental appointment.",
      slug: "signs-you-should-see-a-dentist",
      sections: [
        {
          body: "Most dental problems are far easier — and less expensive — to treat when caught early. The challenge is that many issues start without obvious pain, making it tempting to put off a visit. Knowing the warning signs can help you act before a small problem becomes a big one. Here are five signals your mouth may be giving you right now.",
        },
        {
          heading: "1. Tooth sensitivity that lingers",
          body: "A brief twinge when you drink something cold is common, but sensitivity that lingers for more than a few seconds after the stimulus is removed can indicate enamel erosion, a cavity, or an exposed root surface. Left untreated, this can progress to nerve involvement requiring more complex treatment.",
          listItems: [
            "Sharp pain when biting into cold or sweet foods may indicate a cavity",
            "Sensitivity to heat as well as cold often points to deeper nerve involvement",
            "Sensitivity in a specific tooth rather than generally across the mouth warrants prompt evaluation",
            "Toothpastes for sensitivity provide temporary relief but do not address the underlying cause",
          ],
          image: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=900&q=80",
          imageAlt: "Patient discussing tooth sensitivity with a dentist",
        },
        {
          heading: "2. Gums that bleed when you brush or floss",
          body: "Occasional bleeding after overly vigorous brushing can happen, but consistent bleeding is not normal. It is one of the earliest visible signs of gum disease, which affects nearly half of adults over 30 and is a leading cause of tooth loss if untreated.",
          listItems: [
            "Bleeding on gentle brushing or flossing is a classic early sign of gingivitis",
            "Swollen, red, or puffy gum tissue often accompanies bleeding",
            "Gum disease has been linked to systemic conditions including heart disease and diabetes",
            "Early-stage gingivitis is reversible with professional cleaning and improved home care",
          ],
          image: "https://images.unsplash.com/photo-1571939228382-b2f2b585ce15?w=900&q=80",
          imageAlt: "Close-up of healthy gum tissue during dental examination",
        },
        {
          heading: "3. Persistent bad breath",
          body: "Bad breath that does not resolve with brushing and flossing is rarely just a diet issue. Chronic halitosis is frequently caused by bacterial buildup in pockets of gum disease, a dry mouth, or decay in a hard-to-reach area. A professional assessment can identify the source and address it directly.",
          listItems: [
            "A coated tongue is a common bacterial reservoir contributing to bad breath",
            "Dry mouth reduces saliva flow, which normally neutralises bacteria in the mouth",
            "Poorly fitting dentures or restorations can trap food and bacteria",
            "Untreated decay creates bacterial pockets that produce persistent odour",
          ],
        },
        {
          heading: "4. A tooth that is visibly chipped, cracked, or darker than its neighbours",
          body: "Chips and cracks that seem minor can propagate under chewing forces and eventually reach the nerve, turning a simple bonding procedure into a root canal. A tooth that has darkened relative to those around it is often showing signs of internal damage or early decay that is not yet painful.",
          listItems: [
            "Hairline cracks are often invisible to the naked eye but show up clearly on dental X-rays",
            "A tooth that is loose or feels different when you bite should be seen within days, not weeks",
            "Darkening in a single tooth can indicate pulp necrosis or early interproximal decay",
            "Early intervention typically means a simpler, less costly restoration",
          ],
        },
        {
          heading: "5. You have not had a checkup in more than 12 months",
          body: "Even if nothing hurts, an annual professional examination catches developing problems before they become symptomatic. X-rays reveal decay between teeth, early bone loss from gum disease, and other changes not visible during a visual exam. Professional cleaning also removes calculus that home brushing cannot address.",
          listItems: [
            "Most dental conditions progress silently — pain is a late-stage symptom, not an early warning",
            "Oral cancer screenings are included in routine examinations and are most effective when performed regularly",
            "Children should see a dentist every six months; adults with stable oral health every 12 months",
            "Patients with active gum disease or a history of cavities often benefit from more frequent visits",
          ],
        },
        {
          heading: "Book an appointment with Smile Dental Group",
          body: "If any of the signs above sound familiar, the best next step is a professional examination. Our team at Smile Dental Group provides thorough checkups, digital X-rays, and gentle, unhurried care for the whole family. Same-week appointments are available at all locations — book online or call us today.",
        },
        {
          heading: "Frequently asked questions",
          body: "",
        },
        {
          heading: "How often should I see a dentist?",
          body: "Most adults with good oral health benefit from an annual checkup and clean. Patients with active gum disease, a high cavity rate, or complex dental history may need to visit every three to six months. Your dentist will recommend a recall interval suited to your individual risk profile.",
        },
        {
          heading: "What happens if I ignore tooth sensitivity?",
          body: "Sensitivity caused by enamel erosion or a small cavity will typically worsen over time. If the decay reaches the pulp of the tooth, a root canal treatment is usually required to save it. Treating sensitivity early — with a filling or a fluoride application — is significantly simpler and less expensive.",
        },
        {
          heading: "Is bleeding when I floss normal?",
          body: "Occasional bleeding when you first start flossing after a gap can normalise within a week or two as the gum tissue becomes healthier. Persistent bleeding despite consistent flossing is not normal and should be evaluated by a dentist or dental hygienist.",
        },
        {
          heading: "Can bad breath be a sign of a serious problem?",
          body: "In most cases, chronic bad breath originates in the mouth and is caused by gum disease, decay, or a dry mouth — all of which are treatable. Rarely, persistent halitosis can signal a systemic condition such as acid reflux or diabetes. A dental examination is the right first step.",
        },
      ],
    },
  },
  {
    id: "b2",
    title: "What to Expect at Your First Dental Checkup: A Complete Guide for New Patients",
    description: "A first-visit guide reduces appointment anxiety and increases new patient bookings by addressing the most common questions AI assistants receive about starting dental care.",
    type: "Blog",
    impact: "High",
    aeoScore: 87,
    category: "Content",
    locations: 10,
    blogContent: {
      heroImage: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=900&q=80",
      metaTitle: "What to Expect at Your First Dental Checkup | Smile Dental Group",
      metaDescription: "Not sure what happens at a new patient dental appointment? Here is a step-by-step guide to what to bring, what your dentist will assess, and how to make the most of your first visit.",
      slug: "what-to-expect-first-dental-checkup",
      sections: [
        {
          body: "Starting care with a new dental practice can feel uncertain, especially if it has been a while since your last appointment. Knowing what to expect takes the guesswork out of your first visit and makes it easier to show up prepared and relaxed. Here is a straightforward walkthrough of how a new patient appointment at Smile Dental Group typically unfolds.",
        },
        {
          heading: "Before your appointment",
          body: "A little preparation before you arrive helps your dentist get the most useful information possible in the time available.",
          listItems: [
            "Bring a list of any medications you are currently taking, including supplements and over-the-counter products",
            "Note any areas of concern — sensitivity, pain, or cosmetic questions — so you can raise them efficiently",
            "If you have recent X-rays from a previous dentist, request a copy or ask them to forward digital files",
            "Arrive a few minutes early if you have not completed your new patient forms online",
          ],
          image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&q=80",
          imageAlt: "New patient completing intake form at dental reception",
        },
        {
          heading: "The medical and dental history review",
          body: "Your dentist will begin by reviewing your health history. This is not a formality — many systemic conditions affect oral health and vice versa, and some medications cause dry mouth or increase bleeding risk during dental procedures. Being thorough here helps your dentist provide safe, personalised care.",
          listItems: [
            "Heart conditions, diabetes, and autoimmune disorders all have oral health implications your dentist needs to know about",
            "Blood thinners and certain blood pressure medications affect treatment planning",
            "Previous allergies to anaesthetics or latex should always be mentioned",
            "Anxiety about dental treatment is common and worth discussing — there are several strategies that can help",
          ],
        },
        {
          heading: "The clinical examination",
          body: "Your dentist will conduct a thorough clinical examination that goes well beyond looking at your teeth. A comprehensive new patient assessment typically includes the following.",
          listItems: [
            "Visual inspection of each tooth surface for signs of decay, wear, cracks, or existing restorations",
            "Periodontal charting — measuring the depth of the pockets between your teeth and gums to assess gum health",
            "Soft tissue examination of the cheeks, tongue, floor of the mouth, and throat for any unusual changes",
            "Occlusion assessment — how your upper and lower teeth meet and whether there are signs of grinding or jaw joint issues",
            "Oral cancer screening, which takes less than two minutes and is included as standard",
          ],
          image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&q=80",
          imageAlt: "Dentist conducting thorough examination of patient's teeth",
        },
        {
          heading: "X-rays",
          body: "For most new patients, a set of diagnostic X-rays is taken during the first visit. Modern digital X-rays use a fraction of the radiation of older film-based systems and provide information that no visual examination can replicate — including decay between teeth, bone levels, and the position of roots and unerupted teeth.",
          listItems: [
            "Bitewing X-rays show the crowns of upper and lower teeth and reveal decay between teeth",
            "Periapical X-rays show the full length of a tooth including the root and surrounding bone",
            "A panoramic X-ray shows the full dentition, jaw joints, and sinus areas in a single image",
            "If you have recent X-rays from another provider, discuss with your dentist whether additional images are needed",
          ],
        },
        {
          heading: "Professional cleaning",
          body: "If time allows and there are no concerns requiring priority treatment, your first appointment will typically include a professional scale and clean. This removes calculus (hardened plaque) from above and below the gumline — something regular brushing and flossing cannot do — and finishes with a polish.",
        },
        {
          heading: "Your personalised treatment plan",
          body: "At the end of your appointment, your dentist will walk you through their findings and — if any treatment is needed — present a clear treatment plan with options, priorities, and costs. There is no pressure to proceed with everything at once. Our team is here to help you make informed decisions about your care at a pace that works for you.",
        },
        {
          heading: "Frequently asked questions",
          body: "",
        },
        {
          heading: "How long does a new patient appointment take?",
          body: "A comprehensive new patient appointment at Smile Dental Group typically takes 60 to 90 minutes. This allows time for the health history review, full clinical examination, X-rays, and a professional clean. If significant treatment is identified, a separate appointment is usually scheduled to address it.",
        },
        {
          heading: "Do I need a referral to book as a new patient?",
          body: "No referral is required. You can book directly online or by calling your nearest Smile Dental Group location. We welcome patients of all ages and accept most major health funds.",
        },
        {
          heading: "Will my first visit be painful?",
          body: "For most patients, a routine checkup and clean is completely comfortable. If you experience sensitivity during cleaning, let your hygienist know and they can adjust their approach. If any treatment beyond a clean is needed, local anaesthetic is used and you will not feel pain during the procedure.",
        },
        {
          heading: "What if I am nervous about going to the dentist?",
          body: "Dental anxiety is very common and nothing to be embarrassed about. Let our team know when you book and again when you arrive — we can offer a slower, more communicative approach, signal words so you feel in control, and where appropriate, referral for sedation options.",
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
