
const express = require('express');
const handlebars = require('express-handlebars');
const {Server: HTTPServer} = require("http")
const {Server: IOServer} = require("socket.io");
const app = express();
const httpServer = new HTTPServer(app)
const io = new IOServer(httpServer)
const {faker} = require("@faker-js/faker");
const  {mongoose}  = require("mongoose");
const {normalize} = require("normalizr");
const {schema} = require("normalizr");




//PERSISTENCIA PRODUCTOS
const {optionsSQL} = require("./options/mysql.js");
const Contenedor = require('./clase-contenedor.js');
const arrayProductos = new Contenedor(optionsSQL, "productos");



app.use(express.static('views'))

//*HANDLEBARS
app.set('views', './views/')


 const hbs = handlebars.engine({
   extname: "hbs",
   layoutsDir: "./views/layouts/",
 });
 app.engine("hbs", hbs);
 app.set("view engine", "hbs")


 app.use(express.urlencoded({extended: true}))
 app.use(express.json())



//productos-test
    let listaProductos = [];
    function crearProductosRandom(){
        for(let i=0; i<5; i++){
            listaProductos.push( 
                {
                    title: faker.commerce.product().toString(),
                    price: faker.commerce.price(100, 200, 0, '$').toString(),
                    thumbnail: faker.image.imageUrl(100, 100).toString()
                } 
            )
        }
        return listaProductos;
    }


// PERSISTENCIA MENSAJES

const ContenedorMongoDB = require("./ContenedorMongoDB.js");
const Schema = mongoose.Schema;
 const model = mongoose.model;

const mensajeSchemaMongo = new Schema({
    email: { type: String, required: true, max:100 },
    nombre: { type: String, required: true, max: 100 },
    apellido: { type: String, required: true, max: 100 },
    edad: { type: String, required: true, max: 3 },
    alias: { type: String, required: true, max: 100 },
    avatar: { type: String, required: true, max: 1000 },
    text: {type: String, required:true, max: 1000 }
});
const modeloMensajes = model('modeloMensajes', mensajeSchemaMongo);
const rutaMensajes = 'mongodb://127.0.0.1:27017/DB-Mensajes';
const baseMongo = 'DB-Mensajes';
const coleccionMensajes = 'coleccionMensajes';
const Mensajes = new ContenedorMongoDB(rutaMensajes, modeloMensajes, baseMongo, coleccionMensajes );
async function conectarMongo(){
    await Mensajes.connectMG()
    console.log("MongoDB conectado")
} 
conectarMongo()


        //esquemas para normalizacion
        const mailSchema = new schema.Entity('email');
        const nombreSchema = new schema.Entity('nombre');
        const apellidoSchema = new schema.Entity('apellido');
        const edadSchema = new schema.Entity('edad');
        const aliasSchema = new schema.Entity('alias');
        const avatarSchema = new schema.Entity('avatar');
        const textSchema = new schema.Entity('text');

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

        const mapearMsjs = (arrMensajes) =>{
            const mapNormalizar = arrMensajes.map((item)=>(
                {
                    email: item.email,
                    nombre: item.nombre, 
                    apellido:  item.apellido,
                    edad:  item.edad,
                    alias:  item.alias,
                    avatar:  item.avatar,
                    text:  item.text,
                    fecha:  item.fecha
                }
            ))
            return mapNormalizar
        }






//RUTAS

 app.get('/', async (req, res)=>{
    try{
        const listaProductos = await arrayProductos.getAll();
        console.log("se pudo acceder a productos")
        if(listaProductos){
            res.render("main", { layout: "vista-productos", productos: listaProductos });
        }else{
            res.render("main", {layout: "error"})
        }
    }
    catch(err){
        console.log(err)
    }
})

app.get('/api/productos-test', async (req, res)=>{
    res.render("main", { layout: "productos-test"})
})



//*WEBSOCKET PRODUCTOS Y MENSAJES
//'1) conexión del lado del servidor
io.on('connection', async (socket) =>{
        console.log(`io socket conectado ${socket.id}`);
            const listaMensajes =  Mensajes.listarTodos()
            const arrMapeado = mapearMsjs(listaMensajes)
            const normalizado = normalize(arrMapeado, authorSchema);
            socket.emit("mensajes", normalizado)
            socket.emit("productos", await arrayProductos.getAll())
            socket.emit("prod-test", crearProductosRandom())

        //' 3) escuchar un cliente (un objeto de producto)
        socket.on('new_prod', async (data) =>{
            await arrayProductos.save(data)
            const listaActualizada = await arrayProductos.getAll();
        //' 4) y propagarlo a todos los clientes: enviar mensaje a todos los usuarios conectados: todos pueden ver la tabla actualizada en tiempo real
        io.sockets.emit('productos', listaActualizada)
        })
        
        socket.on('new_msg', async (data)=>{
            await Mensajes.guardar(data);
            const listaMensajes = await Mensajes.listarTodos();

//NORMALIZACION Y ENVÍO DE MENSAJES
            const arrMapeado = mapearMsjs(listaMensajes)
            const normalizado = normalize(arrMapeado, authorSchema);
            console.log(JSON.stringify(normalizado))
            io.sockets.emit('mensajes', normalizado)
        })
        
})




httpServer.listen(8080, ()=>{
    console.log('servidor de express iniciado')

})