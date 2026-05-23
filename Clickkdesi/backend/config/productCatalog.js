export const PRODUCT_MEDIA_FOLDER = "clickkdesi/products";
export const SITE_MEDIA_FOLDER = "clickkdesi/site";
export const VIDEO_MEDIA_FOLDER = "clickkdesi/video";

export const productMediaPublicId = (name) =>
  `${PRODUCT_MEDIA_FOLDER}/${name.replace(/\.[^.]+$/, "")}`;

export const siteMediaPublicIds = {
  logo: `${SITE_MEDIA_FOLDER}/logo`,
  categoryFullSleeves: `${SITE_MEDIA_FOLDER}/category-full-sleeves`,
  categorySleeveless: `${SITE_MEDIA_FOLDER}/category-sleeveless`,
  sizeChart: `${SITE_MEDIA_FOLDER}/size-chart`,
};

export const videoMediaPublicIds = {
  homepage: `${VIDEO_MEDIA_FOLDER}/homepage`,
};

export const legacyPhotoPublicIds = {
  "c1.jpg": siteMediaPublicIds.categoryFullSleeves,
  "c2.jpg": siteMediaPublicIds.categorySleeveless,
  "logo.jpg": siteMediaPublicIds.logo,
  "sc.jpg": siteMediaPublicIds.sizeChart,
  "sc.jpeg": siteMediaPublicIds.sizeChart,
};

for (let i = 1; i <= 20; i += 1) {
  legacyPhotoPublicIds[`p${i}.jpg`] = productMediaPublicId(`p${i}.jpg`);
}

const commonDescription = `
- Made with 100% cotton
- Lightweight, breathable
- Comfortable for all day wear
- Making each piece uniquely yours
- Customisation available
`;

export const productCatalog = [
  {
    name: "Navya",
    mrp: 999,
    price: 729,
    category: "Sleeveless",
    imagePublicId: productMediaPublicId("p1.jpg"),
    hoverImagePublicId: productMediaPublicId("p2.jpg"),
    imageAlt: "Navya sleeveless cotton kurti",
    description: commonDescription,
  },
  {
    name: "Aalya",
    mrp: 899,
    price: 719,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p3.jpg"),
    hoverImagePublicId: productMediaPublicId("p4.jpg"),
    imageAlt: "Aalya full sleeves cotton kurti",
    description: commonDescription,
  },
  {
    name: "Naina",
    mrp: 999,
    price: 729,
    category: "Sleeveless",
    imagePublicId: productMediaPublicId("p5.jpg"),
    hoverImagePublicId: productMediaPublicId("p5.jpg"),
    imageAlt: "Naina sleeveless cotton kurti",
    description: commonDescription,
  },
  {
    name: "Myra",
    mrp: 849,
    price: 699,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p6.jpg"),
    hoverImagePublicId: productMediaPublicId("p6.jpg"),
    imageAlt: "Myra full sleeves cotton kurti",
    description: commonDescription,
  },
  {
    name: "Tara",
    mrp: 899,
    price: 719,
    category: "Sleeveless",
    imagePublicId: productMediaPublicId("p9.jpg"),
    hoverImagePublicId: productMediaPublicId("p9.jpg"),
    imageAlt: "Tara sleeveless cotton kurti",
    description: commonDescription,
  },
  {
    name: "Jheel",
    mrp: 999,
    price: 709,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p8.jpg"),
    hoverImagePublicId: productMediaPublicId("p8.jpg"),
    imageAlt: "Jheel full sleeves cotton kurti",
    description: commonDescription,
  },
  {
    name: "Siya",
    mrp: 949,
    price: 719,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p10.jpg"),
    hoverImagePublicId: productMediaPublicId("p10.jpg"),
    imageAlt: "Siya full sleeves cotton kurti",
    description: commonDescription,
  },
  {
    name: "Heer",
    mrp: 899,
    price: 699,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p11.jpg"),
    hoverImagePublicId: productMediaPublicId("p12.jpg"),
    imageAlt: "Heer full sleeves cotton kurti",
    description: commonDescription,
  },
  {
    name: "Saanjh",
    mrp: 999,
    price: 719,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p13.jpg"),
    hoverImagePublicId: productMediaPublicId("p14.jpg"),
    imageAlt: "Saanjh full sleeves cotton kurti",
    description: commonDescription,
  },
  {
    name: "Gulaabo 2.0",
    mrp: 1399,
    price: 749,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p15.jpg"),
    hoverImagePublicId: productMediaPublicId("p16.jpg"),
    imageAlt: "Gulaabo 2.0 full sleeves cotton kurti",
    description: commonDescription,
  },
  {
    name: "Gulaabo",
    mrp: 1399,
    price: 749,
    category: "Sleeveless",
    imagePublicId: productMediaPublicId("p17.jpg"),
    hoverImagePublicId: productMediaPublicId("p18.jpg"),
    imageAlt: "Gulaabo sleeveless cotton kurti",
    description: commonDescription,
  },
  {
    name: "Noori",
    mrp: 1299,
    price: 729,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p19.jpg"),
    hoverImagePublicId: productMediaPublicId("p20.jpg"),
    imageAlt: "Noori full sleeves cotton kurti",
    description: commonDescription,
  },
];
