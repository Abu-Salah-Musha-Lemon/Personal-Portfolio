async function loadComponent(id, file) {

    const response = await fetch(file);
    const html = await response.text();

    const element = document.getElementById(id);

    if(element){
        element.innerHTML = html;
    }

}

loadComponent("head","/components/head.html");
loadComponent("navbar","/components/navbar.html");
loadComponent("footer","/components/footer.html");