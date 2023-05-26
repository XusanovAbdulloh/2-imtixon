import { Router } from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import "dotenv/config";
import { genValidator } from "../utils/genValidator.js";
import {
  userEditSchema,
  userLoginSchema,
  userRegisterSchema,
  bookPostEditSchema,
  authorSchema
} from "../schemas/schemas.js";
import db from "../db/index.js";
import { isSuperAdmin } from "../utils/isSuperAdmin.js";
import { isAdmin } from "../utils/isAdmin.js";
import { isAdminDel } from "../utils/isAdminDelete.js";
import { isLoggedIn } from "../utils/isLoggedin.js";

const Edit = genValidator(userEditSchema);
const Register = genValidator(userRegisterSchema);
const Login = genValidator(userLoginSchema);
const bookSchema = genValidator(bookPostEditSchema)
const authorschema = genValidator(authorSchema)


const router = Router();

router.get("/users", isAdmin, async (req, res, next) => {
  try {
    await db.read();
    if (req.query.role == "admin") {
      return res.json(db.data.users.filter((user) => user.role === "admin"));
    }
    if (req.query.role == "customer") {
      return res.json(db.data.users.filter((user) => user.role === "customer"));
    }

  } catch (error) {
    next(error);
  }
});

router.get("/users/me", isLoggedIn, async (req, res, next) => {
  try {
    await db.read();
    const user = db.data.users.find((u) => u.id === req.user.userId);
    res.json({user});
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", isAdminDel, async (req, res, next) => {
  try {
    await db.read();
    db.data.users = db.data.users.filter((user) => user.id !== req.params.id);
    await db.write();
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/me", isLoggedIn, Edit, async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.read();
    const user = db.data.users.find((u) => u.id === req.user.userId);
    console.log(user);
    const userIndex = db.data.users.indexOf(user);
    db.data.users.splice(userIndex, 1, {
      id: user.id,
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });
    await db.write();

    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    next(error);
  }
});

router.post("/users/register",Register, async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);
    await db.read();
    const existingUser = db.data.users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "nooooo" });
    }
    await db.read()
    db.data.users.push({
      id: randomUUID(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "customer",
    });
    await db.write();

    res.status(201).json({ message: "Registred successful" });
  }
  catch (error) {
    next(error);
  }
});

router.post("/users", Register, isSuperAdmin, async (req, res, next) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    const salt = await bcrypt.genSalt(8);
    const hashedPassword = await bcrypt.hash(password, salt);

    await db.read();
    const existingUser = db.data.users.find((user) => user.email === email);
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    db.data.users.push({
      id: randomUUID(),
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "admin",
    });
    await db.write();

    res.status(201).json({ message: "Registred successful" });
  } catch (error) {
    next(error);
  }
});

router.post("/users/login", Login, async (req, res, next) => {
  const { email, password } = req.body;
  try {
    await db.read();
    const user = db.data.users.find((u) => u.email === email);
    console.log(user);
    if (!user) {
      return res.status(400).json({ message: "email yoki password notogri" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: 3600 * 60 * 60 }
    );
    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }

});

//  KITOBLAR
 router.get('/books',isLoggedIn,async (req, res, next) => {
  try {
    await db.read();
    if (req.query.category == "maktab") {
       res.json(db.data.books.filter((m) => m.category === "maktab"));
    }
     if (req.query.category == "ertaklar") {
       res.json(db.data.books.filter((m) => m.category === "ertaklar"));
    }
    if (req.query.category == "badiy") {
      res.json(db.data.books.filter((m) => m.category === "badiy"));
    }

    return  res.json(db.data.books)

  } catch (error) {
    next(error);
  }
});

router.post('/books',bookSchema, isLoggedIn, async (req, res)=>{
  await db.read()

  const { title, authorId, category } = req.body;


  const newBook = {
    id: randomUUID(),
    title,
    authorId,
    category,
  };

  db.data.books.push(newBook)
  await db.write()
  res.json({ message: 'successfully' });
})
router.get('/books/:id', async (req, res) => {
  const bookId = parseInt(req.params.id);
  
  await db.read()
  const book = db.data.books.find(book => book.id === bookId);
  
  if (!book) {
   return res.status(404).json({ message: 'Kitob topilmadi' });
  } else {
     res.json(book);
  }
  await db.write()
});

router.patch('/books/:id',bookSchema,isLoggedIn,async (req, res) => {
  const bookId = parseInt(req.params.id);

  const { title, category, authorId } = req.body;
  
  await db.read()
  let book = db.data.books.find(book => book.id === bookId);
  if (!book) {
    res.status(404).json({ message: 'Kitob topilmadi' });
  } else {
    book.title = title;
    book.category = category;
    book.authorId = authorId;
    res.json(book);
  }
  await db.write()
});

router.delete('/books/:id',isLoggedIn, async (req,res,next)=>{
  try {
    await db.read();
    db.data.books = db.data.books.filter((a) => a.id !== req.params.id);
    await db.write();
    res.status(200).json({ message: "book deleted" });
  } catch (error) {
    next(error);
  }
})

// AUTHORS
router.post('/authors',authorschema, isLoggedIn, async (req, res)=>{
  await db.read()
    const { id ,name } = req.body;
    const newAuthor = {
      id: id,
      name: name
    }
    db.data.authors.push(newAuthor)
    await db.write()
    res.json({msg: "succesfyled"})
})


router.get('/authors',async (req, res) => {
  await db.read()
  res.json(db.data.authors)
  await db.write()
})

router.get('/authors/:id', async (req, res) => {
  const idauthor = parseInt(req.params.id)
  await db.read()

  let countBooks = db.data.books.filter(book => book.authorId === idauthor)

  if (countBooks.length === 0) {
    return res.status(401).json({ message: 'author topilmadi' })
  }

  const author = db.data.authors.find(author => author.id === idauthor)
  await db.write()
  res.status(200).json({
    countBooks,
    author
  })
})

router.patch('/authors/:id',authorschema, isLoggedIn, async (req, res)=>{
  const authorID = parseInt(req.params.id);

  const { name } = req.body;
  
  await db.read()
  let patchAuthor = db.data.authors.find(authorrr => authorrr.id === authorID);
  console.log(db.data.authors.id);
  if (patchAuthor.length === 0) {
    res.status(401).json({ message: 'mualif topilmadi' });
  } else {
    patchAuthor.name = name;
    res.json(patchAuthor);
  }
  await db.write()
})

router.delete('/authors/:id', isLoggedIn, async (req ,res, next) =>{
  // ishlamadi kayerdadir hatolik bormi?
  // const authorId = parseInt(req.params.id);
  // const authorIndex = db.data.authors.findIndex(author => author.id === authorId);

  // if (authorIndex !== -1) {
  //   const authorBooks = db.data.books.filter(book => book.authorId === authorId);

  //   if (authorBooks.length === 0) {
  //     authors.splice(authorIndex, 1);
  //     res.sendStatus(204);
  //   } else {
  //     res.status(400).json({ error: 'Mualifni kitobi bor ushan uchun ochira olmaysiz' });
  //   }
  // } else {
  //   res.status(404).json({ error: 'Muallif topilmadi' });
  // }
  try {
    await db.read();
    db.data.authors = db.data.authors.filter((a) => a.id !== parseInt(req.params.id));
    await db.write();
    res.status(200).json({ message: "author deleted" });
  } catch (error) {
    next(error);
  }
})


export default router;
