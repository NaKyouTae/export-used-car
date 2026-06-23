"use client";

import { useTranslation } from "react-i18next";
import PageHeader from "@/components/PageHeader";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="bg-white">
      <PageHeader title={t("Terms of Service")} />

      <article className="px-5 pt-6 pb-10 text-[13px] leading-relaxed text-gray-600 space-y-6">
        <p className="text-[12px] text-gray-400 text-right">
          {t("Effective Date: May 17, 2026")}
        </p>

        <section>
          <p>
            {t(
              'These Terms of Service ("Terms") govern your access to and use of the Ajucar platform ("Service") operated by Dubai Trading Co., Ltd. ("Ajucar", "we", "us"). By creating an account or using the Service, you agree to be bound by these Terms.'
            )}
          </p>
        </section>

        <Section title={t("1. Eligibility")}>
          <p>
            {t(
              "You must be at least 18 years old and capable of forming a binding contract to use the Service. By registering, you represent that the information you provide is accurate and that you have the legal authority to act on behalf of any entity you list as your company."
            )}
          </p>
        </Section>

        <Section title={t("2. Account")}>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              {t(
                "You are responsible for maintaining the confidentiality of the email address used to access your account and for all activities that occur under it."
              )}
            </li>
            <li>
              {t(
                "You must notify us immediately of any unauthorized use of your account."
              )}
            </li>
            <li>
              {t(
                "We reserve the right to suspend or terminate accounts that violate these Terms or that we reasonably believe to be involved in fraudulent activity."
              )}
            </li>
          </ul>
        </Section>

        <Section title={t("3. The Service")}>
          <p>
            {t(
              "Ajucar is a marketplace that connects international buyers with sellers of used vehicles exported from the Republic of Korea. We provide the platform, listing tools, and messaging features."
            )}
          </p>
          <p className="mt-2">
            <strong>
              {t(
                "We are not a party to any sale, purchase, shipping, or financing transaction between buyers and sellers."
              )}
            </strong>{" "}
            {t(
              "All transactions, including pricing, payment, inspection, export, and delivery, are arranged solely between the buyer and the seller."
            )}
          </p>
        </Section>

        <Section title={t("4. Buyer Obligations")}>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              {t(
                "Verify all information about a vehicle directly with the seller before sending payment."
              )}
            </li>
            <li>
              {t(
                "Comply with all import, customs, tax, and safety regulations of your destination country."
              )}
            </li>
            <li>
              {t(
                "Do not contact sellers for purposes unrelated to legitimate vehicle inquiries."
              )}
            </li>
          </ul>
        </Section>

        <Section title={t("5. Seller Obligations")}>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              {t(
                "List only vehicles that you have the legal right to sell and export."
              )}
            </li>
            <li>
              {t(
                "Provide accurate information about the vehicle's condition, mileage, accident history, ownership, and pricing."
              )}
            </li>
            <li>
              {t(
                "Comply with Korean export regulations and all applicable consumer protection laws."
              )}
            </li>
            <li>
              {t(
                "Respond to buyer inquiries in a timely and professional manner."
              )}
            </li>
          </ul>
        </Section>

        <Section title={t("6. Prohibited Conduct")}>
          <p>{t("You agree not to:")}</p>
          <ul className="list-disc pl-5 space-y-1.5 mt-2">
            <li>
              {t("List stolen, counterfeit, or fraudulently obtained vehicles")}
            </li>
            <li>
              {t(
                "Post false, misleading, or deceptive information in listings or messages"
              )}
            </li>
            <li>
              {t("Use the Service to harass, threaten, or defraud other users")}
            </li>
            <li>
              {t(
                "Circumvent the Service to avoid fees or transfer transactions off-platform with the intent to defraud"
              )}
            </li>
            <li>
              {t(
                "Upload viruses, malware, or content that infringes intellectual property rights"
              )}
            </li>
            <li>
              {t(
                "Scrape, crawl, or use automated means to extract data from the Service without our written permission"
              )}
            </li>
            <li>{t("Attempt to gain unauthorized access to other accounts")}</li>
          </ul>
        </Section>

        <Section title={t("7. User Content")}>
          <p>
            {t(
              "You retain ownership of the content you upload (vehicle photos, descriptions, messages). By uploading content, you grant Ajucar a worldwide, non-exclusive, royalty-free license to host, display, and distribute that content for the purpose of operating and promoting the Service. You represent that you have all necessary rights to grant this license."
            )}
          </p>
        </Section>

        <Section title={t("8. Disclaimer of Warranties")}>
          <p>
            {t(
              'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THE ACCURACY OF LISTINGS, THE CONDUCT OF USERS, OR THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.'
            )}
          </p>
        </Section>

        <Section title={t("9. Limitation of Liability")}>
          <p>
            {t(
              "TO THE MAXIMUM EXTENT PERMITTED BY LAW, AJUCAR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE OR ANY TRANSACTION BETWEEN BUYERS AND SELLERS. OUR TOTAL LIABILITY FOR ANY CLAIM SHALL NOT EXCEED THE GREATER OF (A) USD 100 OR (B) THE FEES YOU PAID TO US IN THE 12 MONTHS BEFORE THE EVENT GIVING RISE TO THE CLAIM."
            )}
          </p>
        </Section>

        <Section title={t("10. Indemnification")}>
          <p>
            {t(
              "You agree to indemnify and hold Ajucar harmless from any claims, damages, or expenses arising from (a) your violation of these Terms, (b) your violation of any law or third-party right, or (c) any dispute between you and another user of the Service."
            )}
          </p>
        </Section>

        <Section title={t("11. Termination")}>
          <p>
            {t(
              "You may delete your account at any time through the My Page menu. We may suspend or terminate your access immediately, without notice, if you violate these Terms or engage in conduct that harms other users or the Service. Sections that by their nature should survive termination (including Sections 7 through 10, 13, and 14) will remain in effect."
            )}
          </p>
        </Section>

        <Section title={t("12. Changes to These Terms")}>
          <p>
            {t(
              "We may revise these Terms from time to time. We will notify you of material changes through the Service or by email at least 7 days before they take effect. Continued use of the Service after the effective date constitutes acceptance of the revised Terms."
            )}
          </p>
        </Section>

        <Section title={t("13. Governing Law and Disputes")}>
          <p>
            {t(
              "These Terms are governed by the laws of the Republic of Korea, without regard to conflict-of-laws principles. Any dispute arising from these Terms or your use of the Service shall be submitted to the exclusive jurisdiction of the Seoul Central District Court, Republic of Korea, unless otherwise required by mandatory consumer protection laws of your country of residence."
            )}
          </p>
        </Section>

        <Section title={t("14. Contact")}>
          <div className="mt-2 rounded-xl bg-gray-50 p-4 text-[12px] leading-relaxed text-gray-600 space-y-0.5">
            <p className="font-semibold text-gray-800">
              Dubai Trading Co., Ltd.
            </p>
            <p>{t("CEO: Hae-gi Choi")}</p>
            <p>{t("Business Registration No.: 897-88-01852")}</p>
            <p>
              {t(
                "Address: #1127, Bldg. 1, 16 Jinjangyutong-ro, Buk-gu, Ulsan, Republic of Korea"
              )}
            </p>
            <p>Email: ajucar0510@naver.com</p>
          </div>
        </Section>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[14px] font-semibold text-gray-900 mb-2">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
