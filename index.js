/* variable glbVariant to store which variant we are returning the response
  Later used to transform HTML
*/
let glbVariant = -1; 

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
})

/**
 * Respond with hello worker text
 * @param {Request} request
 */

/* function to return variant randomly using Math.random() 
   To implement A/B testing Style
   */
const getRndInteger = (min, max) => Math.floor(Math.random() * (max - min + 1) ) + min;

/* function to check if a specific cookie exist's in a HTTP request
   if yes then user has already visited
   returning the variant previously displayed to user
   */
const getCookie = (request, name) => {
  let result = -1; // default -1 if cookie not found
  let cookieString = request.headers.get('Cookie');
  if (cookieString) {
    let cookies = cookieString.split(';');
    cookies.forEach(cookie => {
      let cookieName = cookie.split('=')[0].trim();
      if (cookieName === name) {
        let cookieVal = cookie.split('=')[1];
        result = cookieVal;
      }
    });
  }
  return result;
}

const handleRequest = async (request) => {
  const response = await fetch('https://cfw-takehome.developers.workers.dev/api/variants');
  let body = await response.json();
  let urls = [...body.variants]; // the 2 url variants stored
  const cookie = getCookie(request, 'variant') ;
  if (cookie != -1)
  {
    // cookie exist - user visiting again
    let index = cookie; // previously displayed variant
    const responsetoUrl = await fetch(urls[index]);
    glbVariant = 1 + +index; // updating glbVariant
    let res = new Response(responsetoUrl.body, responsetoUrl);
    let transformedHTML = await transformHTML(res); // tranforming HTML
    return transformedHTML;
  }
  else
  {
    // if user visiting for 1st time
    let index = getRndInteger(0,1); // variant on the basis of A/B testing Style
    const responsetoUrl = await fetch(urls[index]);
    glbVariant = 1 + +index; 
    let res = new Response(responsetoUrl.body, responsetoUrl);
    let transformedHTML = await transformHTML(res);
    let date = new Date();
    let newDate = new Date(date.getTime() + 31536000000);
    const cookieData = `variant = ${index}; Expires=${newDate.toGMTString()}`; // creating cookie data
    transformedHTML.headers.set('Set-Cookie', cookieData); // sending http cookie to new user
    return transformedHTML;
  }
}

class ReplaceLink
{
  //tranforming link - replacing it with my linkedin profile
	constructor(attributeName)
	{
		this.attributeName = attributeName;
	}

	element(element)
	{
		const attribute = element.getAttribute(this.attributeName);
    if (attribute) 
    {
      element.setAttribute(this.attributeName, attribute.replace('https://cloudflare.com', 'https://www.linkedin.com/in/pushmit-gupta-760539172/'));
    }
    element.setInnerContent('Visit my LinkedIn Profile!');
	}
}

class ReplaceWebPageTitle
{
  // transforming Web Page Title to #variant. Pushmit Gupta
  element(element)
  {
    element.setInnerContent(`${glbVariant}. Pushmit Gupta`);
  }
}

class ReplaceMainTitle
{
  // transforming Main title to Pushmit Gupta - #variant
  element(element)
  {
    element.setInnerContent(`Pushmit Gupta - ${glbVariant}`);
  }
}

class ReplaceDescription
{
  // tranforming description
  element(element)
  {
    element.setInnerContent(`This is variant ${glbVariant} of the Full Stack Internship Task!`);
  }
}

// function to transform HTML using HTML ReWriter
const transformHTML = async (response) => {
  const rewriter = new HTMLRewriter()
    .on('title', new ReplaceWebPageTitle())
    .on('h1#title', new ReplaceMainTitle())
    .on('p#description', new ReplaceDescription())
    .on('a#url', new ReplaceLink('href'))
  return rewriter.transform(response);
}