let id=0;

const catalog=document.getElementById("catalog");
for (let i = 0; i < 1; i++) {
const card=document.createElement("div");
card.className='card';
card.innerHTML=`
<h3>Медовик классический</h3>
<p>Нежный медовый торт с кремом на основе сметаны</p>
<p>${id}</p>
<p class="price">850 ₽</p>
`;
catalog.appendChild(card);


id++;
}



fetch("data/product.json")
  .then(res => res.json())
  .then(products => {
      createCards(products); // передаём массив в функцию
  });

function createCards(products) {
    products.forEach(item => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
            <h3>${item.Name}</h3>
            <p>${item.Description}</p>
            <p class="price">${item.Price} ₽</p>
        `;
        document.getElementById("catalog").appendChild(card);
    });
}