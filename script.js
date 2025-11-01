let id=0;

const catalog=document.getElementById("catalog");
for (let i = 0; i < 1; i++) {
const card=document.createElement("div");
card.className='card';
card.innerHTML=`
  <div class="card-inner">
      <div class="card-front">
        <h3>Медовик классический</h3>
        <p>850 ₽</p>
      </div>
      <div class="card-back">
        <p>Нежный медовый торт с кремом на основе сметаны</p>
        <p>ID: ${id}</p>
      </div>
    </div>
`;
//catalog.appendChild(card);


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
           <div class="card-inner">
      <div class="card-front">
       <img src="source/cake.png" alt="Медовик" class="card-img">
        <h3>${item.Name}</h3>
        <p>${item.Price} ₽</p>
      </div>
      <div class="card-back">
        <p>${item.Description}</p>
        <p>ID: ${id}</p>
      </div>
    </div>
        `;
        document.getElementById("catalog").appendChild(card);
    });
}
const socket = new WebSocket('ws://localhost:5500');

socket.onmessage = function(event) {
    const products = JSON.parse(event.data);
    console.log('Обновлённые товары:', products);
};

socket.onmessage = (event) => {
    const products = JSON.parse(event.data);
    renderProducts(products); // функция обновляет HTML
};
