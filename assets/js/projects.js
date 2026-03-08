fetch("../../data/projects.json")
  .then(response => response.json())
  .then(data => {

    let output = "";

    data.forEach(project => {

      output += `

            <div class="port_card">
            <div class="img_p">
              <img src="${project.imgLink}" class="p_img_p" alt="" srcset="" />
            </div>
            <div class="port_card_desc">
                <h3 class="port_card_title">${project.ProjectName}</h3>
                <h3 class="port_card_title">Technology: ${project.Technology}</h3>
                <a href="${project.webLink}"  class="port_card_button" target="_blank" rel="noopener noreferrer">Live</a>
                <!-- <a href="${project.Code}"     class="port_card_button" target="_blank" rel="noopener noreferrer">Code</a>-->
            </div>
      </div>

      `;

    });

    document.getElementById("projects-container").innerHTML = output;

  })
  .catch(error => console.error(error));