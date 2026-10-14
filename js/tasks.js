"use strict";

(function () {
  const tasks = [
    {
      id: "social-media-banner",
      title: "Design a Social Media Banner",
      category: "graphic-design",
      categoryLabel: "Graphic Design",
      description:
        "Create a promotional banner for a student-owned business.",
      details:
        "Design a clear, attractive promotional banner suitable for a student-owned business. The requester should provide the brand name, text, images and preferred dimensions before work begins.",
      budget: 8000,
      location: "remote",
      duration: 2,
      durationLabel: "2 days",
      deliverables: [
        "One completed promotional banner.",
        "An agreed image format suitable for online use.",
        "A final design based on the supplied brief."
      ],
      postedBy: "Demo Student",
      status: "open"
    },
    {
      id: "portfolio-website",
      title: "Build a Portfolio Website",
      category: "web-development",
      categoryLabel: "Web Development",
      description:
        "Build a responsive portfolio website with a clear project gallery.",
      details:
        "Create a responsive portfolio website that presents projects, skills and contact information. Confirm the required pages, content, features and delivery date before development begins.",
      budget: 25000,
      location: "remote",
      duration: 5,
      durationLabel: "5 days",
      deliverables: [
        "A responsive portfolio website.",
        "A project gallery section.",
        "A contact section.",
        "Source files for the completed work."
      ],
      postedBy: "Demo Student",
      status: "open"
    },
    {
      id: "blog-articles",
      title: "Write Five Blog Articles",
      category: "writing",
      categoryLabel: "Writing",
      description:
        "Prepare five original articles on agreed topics and keywords.",
      details:
        "Write five original articles using topics and keywords agreed with the requester. Confirm the expected word count, tone, research requirements and deadline before starting.",
      budget: 15000,
      location: "remote",
      duration: 4,
      durationLabel: "4 days",
      deliverables: [
        "Five original articles.",
        "Content organised for easy review.",
        "Delivery in an agreed document format."
      ],
      postedBy: "Demo Student",
      status: "open"
    },
    {
      id: "product-photo-session",
      title: "Photograph Products for a Catalogue",
      category: "photography",
      categoryLabel: "Photography",
      description:
        "Produce a set of clear product images for a small catalogue.",
      details:
        "Photograph products for a small business catalogue. Agree on the number of products, shoot location, editing requirements and final image formats before the session.",
      budget: 20000,
      location: "awka",
      duration: 3,
      durationLabel: "3 days",
      deliverables: [
        "An agreed set of product photographs.",
        "Basic image adjustments as agreed.",
        "Final images in the agreed format."
      ],
      postedBy: "Demo Student",
      status: "open"
    },
    {
      id: "brand-social-content",
      title: "Prepare Social Media Content",
      category: "digital-marketing",
      categoryLabel: "Digital Marketing",
      description:
        "Plan a week of social content for a small business.",
      details:
        "Prepare a one-week content plan for a small business. Agree on the target audience, social platforms, posting frequency and content style before beginning.",
      budget: 10000,
      location: "onitsha",
      duration: 2,
      durationLabel: "2 days",
      deliverables: [
        "A one-week content plan.",
        "Suggested post topics and captions.",
        "A schedule for the agreed platforms."
      ],
      postedBy: "Demo Student",
      status: "open"
    },
    {
      id: "landing-page",
      title: "Create a Product Landing Page",
      category: "web-development",
      categoryLabel: "Web Development",
      description:
        "Develop a simple responsive landing page with a contact section.",
      details:
        "Build a responsive landing page to introduce a product or service. Confirm the content, layout, required sections and contact method before development starts.",
      budget: 35000,
      location: "remote",
      duration: 6,
      durationLabel: "6 days",
      deliverables: [
        "A responsive product landing page.",
        "An agreed contact section.",
        "The source files for the completed page."
      ],
      postedBy: "Demo Student",
      status: "open"
    }
  ];

  function getAll() {
    return tasks.map((task) => ({
      ...task,
      deliverables: [...task.deliverables]
    }));
  }

  function getById(id) {
    const task = tasks.find((item) => item.id === id);

    if (!task) return null;

    return {
      ...task,
      deliverables: [...task.deliverables]
    };
  }

  function formatPrice(amount) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    }).format(amount);
  }

  window.NEDIKETasks = Object.freeze({
    getAll,
    getById,
    formatPrice
  });
})();
