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

// $(document).ready(function(){
//   $('navbar a').click(function(){
//     $('navbar a').removeClass("active");
//     $(this).addClass("active");
// });
// });
{
  /* <script src="https://code.jquery.com/jquery-1.12.4.js" integrity="sha256-Qw82+bXyGq6MydymqBxNPYTaUXXq7c8v3CwiYwLLNXU=" crossorigin="anonymous"></script> */ }


let select = window.location.pathname.split('/')[1];
let navbar = document.querySelectorAll('navbar').forEach(link => {
  let active = link.classList.add('active');
  console.log(active);
})