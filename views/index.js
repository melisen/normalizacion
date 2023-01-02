
const {denormalize} = require("normalizr");

//' conexión del socket del lado del cliente
const socket = io.connect()



function render(data){
    //por cada objeto de producto ingresado crear una row en la tabla con la información:
    const html = data.map( msg =>
        `
        <tr>
            
            <td rowspan="1" colspan="10" style=" font-weight:normal;  padding:5px; ">
            ${msg.title}
            </td >
            <td rowspan="1" colspan="20" style=" font-weight:normal;  padding:5px;">
            $ ${msg.price}
            </td>
            <td rowspan="1" colspan="10" style=" font-weight:normal; padding:5px;">
              <img src="${msg.thumbnail}" height="100px">
            </td>
        </tr>
      `).join(" ");
      document.getElementById('productos').innerHTML = html; 
}

function renderChat(data){
    //por cada objeto de producto ingresado crear una row en la tabla con la información:
    const html = data.map( msg =>
        `
        <li style="display: flex; flex-direction:row; ">
            <div id="autor" style="font-weight: bold; color:blue;" >
                ${msg.author.nombre} <span style="color: brown; font-weight:normal; margin-left:5px;">  ${msg.fecha}  :</span> 
            </div>
            <div id="msj"  style="color: green; font-style: italic; margin-left:15px;">
               ${msg.text}
            </div>
        </li>
      `).join(" ");
      document.getElementById('chatCompleto').innerHTML = html; 
}


function renderProdTest(data){
    const html = data.map( msg =>
        `
        <tr>
            <td rowspan="1" colspan="10" style=" font-weight:normal;  padding:5px; ">
            ${msg.title}
            </td >
            <td rowspan="1" colspan="20" style=" font-weight:normal;  padding:5px;">
            $ ${msg.price}
            </td>
            <td rowspan="1" colspan="10" style=" font-weight:normal; padding:5px;">
              <img src="${msg.thumbnail}" height="100px">
            </td>
        </tr>
      `).join(" ");
      document.getElementById('productos-random').innerHTML = html; 
}

//' 2) Cliente envía llena el form con un nuevo producto: el evento es onclick en btn Enviar en vista-productos.hbs
function enviarProducto(){
    const title = document.getElementById('title').value
    const price = document.getElementById('price').value
    const thumbnail = document.getElementById('thumbnail').value
    socket.emit('new_prod', {title: title, price: price, thumbnail:thumbnail})
    document.getElementById('title').value = ''
    document.getElementById('price').value = ''
    document.getElementById('thumbnail').value = ''
    return false
}

function enviarMensaje(event){
    const fecha = new Date().toLocaleDateString()+ new Date().toTimeString();
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    const edad = document.getElementById('edad').value;
    const alias = document.getElementById('alias').value;
    const avatar = document.getElementById('avatar').value;
    const text = document.getElementById('chat_mensaje').value;
    if(email){
        socket.emit('new_msg', {
                email: email,
                nombre: nombre, 
                apellido: apellido,
                edad: edad,
                alias: alias,
                avatar: avatar,
                text: text,
                fecha: fecha
        })
        document.getElementById('chat_mensaje').value = '';
        return false
    }else{
        alert("Debe ingresar su email")
    }
    

}

//' 5) escuchar al servidor que integró al nuevo prod en el array de productos y mostrarlo
socket.on('productos', data =>{
    render(data)
})
socket.on('prod-test', data =>{
    renderProdTest(data)
})



        //esquemas para normalizacion
        const mailSchema = new schema.Entity('mail');
        const nombreSchema = new schema.Entity('nombr');
        const apellidoSchema = new schema.Entity('apellido');
        const edadSchema = new schema.Entity('edad');
        const aliasSchema = new schema.Entity('alias');
        const avatarSchema = new schema.Entity('avatar');
        const authorSchema = new schema.Entity('author',{
            author:{
                id: mailSchema,
                nombre:nombreSchema,
                apellido: apellidoSchema,
                edad: edadSchema,
                alias: aliasSchema,
                avatar: avatarSchema
            },
            text: [textSchema]
        });




socket.on('mensajes', data =>{
    console.log('MENSAJES RECIBIDO')
    console.log("% DE COMPRESIÓN NORMALIZADO", JSON.stringify(data).length);
    const denormalizedMensajes = denormalize(data.result, authorSchema, data.entities);
    console.log("% DE COMPRESIÓN DESNORMALIZADO", JSON.stringify(denormalizedMensajes).length);
    renderChat(denormalizedMensajes.text);
})






