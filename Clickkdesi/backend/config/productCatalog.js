import {
  PRODUCT_MEDIA_FOLDER,
  SITE_MEDIA_FOLDER,
  VIDEO_MEDIA_FOLDER,
  legacyPhotoPublicIds,
  productMediaPublicId,
  siteMediaPublicIds,
  videoMediaPublicIds,
} from "../../shared/mediaConfig.js";

export {
  PRODUCT_MEDIA_FOLDER,
  SITE_MEDIA_FOLDER,
  VIDEO_MEDIA_FOLDER,
  legacyPhotoPublicIds,
  productMediaPublicId,
  siteMediaPublicIds,
  videoMediaPublicIds,
};

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
    price: 719,
    category: "Sleeveless",
    imagePublicId: productMediaPublicId("p30.jpg"),
    hoverImagePublicId: productMediaPublicId("p31.jpg"),
    imageAlt: "Gulaabo sleeveless cotton kurti",
    description: commonDescription,
  },

  {
    name: "Falak",
    mrp: 1299,
    price: 719,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p35.jpg"),
    hoverImagePublicId: productMediaPublicId("p36.jpg"),
    imageAlt: "Noori full sleeves cotton kurti",
    description: commonDescription,
  },

  {
    name: "Aarzu",
    mrp: 1599,
    price: 799,
    category: "Full Sleeves",
    imagePublicId: productMediaPublicId("p32.jpg"),
    hoverImagePublicId: productMediaPublicId("p33.jpg"),
    imageAlt: "Noori full sleeves cotton kurti",
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

  {
    name: "Geet",
    mrp: 1099,
    price: 699,
    category: "Sleeveless",
    imagePublicId: productMediaPublicId("p37.jpg"),
    hoverImagePublicId: productMediaPublicId("p38.jpg"),
    imageAlt: "Geet sleeveless cotton kurti",
    description: commonDescription,
  },

];
