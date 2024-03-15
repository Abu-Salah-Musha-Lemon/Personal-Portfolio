fetch('./inc/nav.html')
.then(response => response.text())
.then(content => {
  document.querySelector('.nav').innerHTML = content;
});
fetch('./inc/head.html')
.then(response => response.text())
.then(content => {
  document.querySelector('.head').innerHTML = content;
});
fetch('./inc/footer.html')
.then(response => response.text())
.then(content => {
  document.querySelector('.footer').innerHTML = content;
});
// portfolio
let httpPortfolio = new XMLHttpRequest();
httpPortfolio.open("get", "./json/portfolio.json", true);

httpPortfolio.send();

httpPortfolio.onload = function () {
  if (this.readyState == 4 && this.status == 200) {
    let products = JSON.parse(this.responseText);

    let output = "";
    for (const i of products) {
      output += `
      <div class="port_card">
            <div class="img_p">
              <img src="${i.imgLink}" class="p_img_p" alt="" srcset="" />
            </div>
            <div class="port_card_desc">
                <h3 class="port_card_title">${i.ProjectName}</h3>
                <h3 class="port_card_title">Technology: ${i.Technology}</h3>
                <a href="${i.webLink}"  class="port_card_button" target="_blank" rel="noopener noreferrer">Live</a>
                <a href="${i.Code}"     class="port_card_button" target="_blank" rel="noopener noreferrer">Code</a>
            </div>
      </div>
           `;
    }
    document.querySelector(".port_card_box").innerHTML = output;
  }
};

// reference 
let httpRefer = new XMLHttpRequest();
httpRefer.open("get", "./json/refer.json", true);

httpRefer.send();

httpRefer.onload = function () {
  if (this.readyState == 4 && this.status == 200) {
    let products = JSON.parse(this.responseText);

    let refer = "";
    for (const i of products) {
      refer += `
          <div class="re_reCom">
              <div class="re_card">
                  <div class="re_info">
                    <h2>Name: ${i.Name}</h2>
                    <h3>${i.head}</h3>
                    <h3>${i.dept}</h3>
                    <h3>${i.university}</h3>
                    <h4>
                      <i class="bi bi-geo-alt re_reC_i"></i> ${i.location}
                    </h4>
                    
                    <h4><i class="bi bi-envelope re_reC_i"></i><a href="mailto:${i.email}"    class="email_text">${i.email}</a> </h4>
                    <h4><i class="bi bi-telephone-fill re_reC_i"></i><a href="tel:${i.phone}"  class="email_text">${i.phone}</a></h4>
                    <h5></h5>
                  </div>
                  <div class="re_rc_img">
                    <img src="${i.imgLink}" alt="" srcset="" />
                  </div>
              </div>
          </div>
       `;
    }
    document.querySelector(".refer").innerHTML = refer;
  }
};


// Disable right-click
document.addEventListener('contextmenu', (e) => e.preventDefault());

function ctrlShiftKey(e, keyCode) {
  return e.ctrlKey && e.shiftKey && e.keyCode === keyCode.charCodeAt(0);
}

document.onkeydown = (e) => {
  // Disable F12, Ctrl + Shift + I, Ctrl + Shift + J, Ctrl + U
  if (
    event.keyCode === 123 ||
    ctrlShiftKey(e, 'I') ||
    ctrlShiftKey(e, 'J') ||
    ctrlShiftKey(e, 'C') ||
    (e.ctrlKey && e.keyCode === 'U'.charCodeAt(0))
  )
    return false;
};
document.addEventListener('DOMContentLoaded', function () {
  var content = document.querySelector('.main');

  content.addEventListener('scroll', function () {
      // When scrolling occurs, show the scrollbar
      document.body.style.overflow = 'auto';
  });
});





