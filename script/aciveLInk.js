const activePage = window.location.href; // it is used for finding the location path of the current page
console.log(activePage);
const navLinks = document.querySelectorAll('.navbar a').forEach(link => {
  if (link.href.includes(`${activePage}`)) {
    // console.log(link.href);
    link.classList.add('active');
    // console.log(activePage); // Corrected the variable name here
  }
});
// const pageName = activePage.split('/').pop();
// if (pageName ==='index.htm') {
//   console.log(pageName);
//   document.querySelectorAll('.hom').classList.replace('hom','active');
// }