// Set your backend API base URL here after hosting
   // const prodServerUrl = "http://localhost:7080/api";

    const prodServerUrl="https://seo-tool-backend-d9of.onrender.com/api"


   // Frontend site base URLs (no NEXT_PUBLIC env usage)
   const siteProdUrl = "https://medium.sisyphusinfotech.com/";
   const siteDevUrl = "http://localhost:3000";
   const siteBaseUrl = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production')
    ? siteProdUrl
    : siteDevUrl;

export { prodServerUrl, siteBaseUrl };
