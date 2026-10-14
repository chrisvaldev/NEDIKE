"use strict";

/*
 * NEDIKE — Shared Service Catalogue
 * File: js/services.js
 *
 * Shared by the services listing and service details pages.
 * These are demonstration listings, not verified offers.
 */

(function () {
  const services = [
    {
      id: "business-flyer",
      title: "Business Flyer Design",
      category: "graphic-design",
      categoryLabel: "Graphic Design",
      description:
        "Promotional flyers for businesses, events and product launches.",
      price: 5000,
      location: "remote",
      image:
        "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Graphic design work on a screen",
      provider: "Demo Graphic Designer",
      providerInfo: "Graphic design · Sample profile",
      details:
        "Promotional flyer design for businesses, student events and product launches. Share your brand details, target audience and content requirements before the design begins."
    },
    {
      id: "business-website",
      title: "Responsive Business Website",
      category: "web-development",
      categoryLabel: "Web Development",
      description:
        "A responsive website for a small business or personal brand.",
      price: 45000,
      location: "remote",
      image:
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Website analytics on a laptop",
      provider: "Demo Web Developer",
      providerInfo: "Web development · Sample profile",
      details:
        "A responsive website concept for a small business or personal brand. Agree on the number of pages, content, functionality and delivery schedule before work starts."
    },
    {
      id: "product-photography",
      title: "Product Photography",
      category: "photography",
      categoryLabel: "Photography",
      description:
        "Product photos for shops, catalogues and online promotion.",
      price: 15000,
      location: "awka",
      image:
        "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Camera equipment",
      provider: "Demo Photographer",
      providerInfo: "Photography · Sample profile",
      details:
        "Product photography for catalogues, shops and online businesses. Confirm the shoot location, number of products, editing requirements and delivery format beforehand."
    },
    {
      id: "content-writing",
      title: "Writing and Content Creation",
      category: "writing",
      categoryLabel: "Writing",
      description:
        "Clear content for websites, blogs and business communications.",
      price: 10000,
      location: "remote",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Notebook and writing tools",
      provider: "Demo Content Writer",
      providerInfo: "Writing · Sample profile",
      details:
        "Content support for websites, blogs and business communication. Agree on the topic, word count, research expectations and deadline before the assignment begins."
    },
    {
      id: "app-ui-design",
      title: "Mobile App UI Design",
      category: "mobile-app-development",
      categoryLabel: "Mobile App Development",
      description:
        "Interface concepts for mobile products and student projects.",
      price: 60000,
      location: "remote",
      image:
        "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Mobile phone and interface design",
      provider: "Demo UI Designer",
      providerInfo: "Mobile interface design · Sample profile",
      details:
        "Interface design concepts for mobile applications. Discuss the required screens, user flows, design handoff format and scope before starting."
    },
    {
      id: "digital-marketing",
      title: "Digital Marketing Support",
      category: "digital-marketing",
      categoryLabel: "Digital Marketing",
      description:
        "Content planning and promotional support for small brands.",
      price: 20000,
      location: "nnewi",
      image:
        "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Digital marketing work",
      provider: "Demo Marketing Student",
      providerInfo: "Digital marketing · Sample profile",
      details:
        "Support with content planning and online promotional activities. Agree on the platforms, deliverables, duration and performance expectations."
    },
    {
      id: "business-support",
      title: "Business Document Formatting",
      category: "business",
      categoryLabel: "Business Services",
      description:
        "Professional formatting for reports, proposals and documents.",
      price: 5000,
      location: "onitsha",
      image:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Business documents on a desk",
      provider: "Demo Business Support Student",
      providerInfo: "Business support · Sample profile",
      details:
        "Formatting and presentation improvements for reports, proposals and other business documents. Confirm the document length, format and delivery deadline."
    },
    {
      id: "personal-tutoring",
      title: "One-to-One Academic Tutoring",
      category: "personal-services",
      categoryLabel: "Personal Services",
      description:
        "Study support in agreed subjects and introductory topics.",
      price: 4000,
      location: "onitsha",
      image:
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=700&q=80",
      imageAlt: "Students studying together",
      provider: "Demo Student Tutor",
      providerInfo: "Academic support · Sample profile",
      details:
        "Study support for agreed subjects and introductory topics. Confirm the subject, session length, location and learning goals before arranging a session."
    }
  ];

  const catalogue = Object.freeze(
    services.map(function (service) {
      return Object.freeze({ ...service });
    })
  );

  window.NEDIKEServices = Object.freeze({
    getAll: function () {
      return catalogue.slice();
    },

    getById: function (id) {
      return catalogue.find(function (service) {
        return service.id === id;
      }) || null;
    },

    formatPrice: function (amount) {
      return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
      }).format(amount);
    }
  });
})();