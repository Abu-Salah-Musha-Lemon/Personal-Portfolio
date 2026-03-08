const username = "YOUR_GITHUB_USERNAME";

fetch(`https://api.github.com/users/${username}/repos`)

  .then(res => res.json())

  .then(data => {

    let output = "";

    data.slice(0, 6).forEach(repo => {

      output += `

<div class="project-card">

<h3>${repo.name}</h3>

<p>${repo.description || "No description"}</p>

<a href="${repo.html_url}" target="_blank">GitHub</a>

</div>

`;

    });

    document.getElementById("github-projects").innerHTML = output;

  });