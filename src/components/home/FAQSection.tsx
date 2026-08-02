import { Accordion } from "@/components/common/Accordion";
import { faqs } from "@/data/faq";

export function FAQSection() {
  return (
    <section className="bg-background py-16 md:py-24" aria-labelledby="faq-title">
      <div className="container-page">
        <h2
          id="faq-title"
          className="text-center text-3xl font-bold text-foreground md:text-[44px]"
        >
          Frequently Asked Questions
        </h2>
        <div className="mx-auto mt-12 max-w-4xl">
          <Accordion items={faqs} defaultOpen={0} />
        </div>
      </div>
    </section>
  );
}
