const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { Client } = require('pg')
const path = require('path')
const multer = require('multer')

const storage = multer.memoryStorage() // Use memory storage for base64 data
const limits = {
  fieldSize: 25 * 1024 * 1024, // 25 MB (adjust as needed)
}

const qr = require('qrcode')

const app = express()
app.use(bodyParser.json())
app.use(cors())

const port = 3003

const client = new Client({
  host: 'localhost',
  user: 'postgres',
  port: 5432,
  password: 'root',
  database: 'postgres',
})

client.connect()

// auth

function createAccount(username, password, role) {
  const res = client.query(
    'INSERT INTO auth (username, password, role) VALUES ($1, $2, $3)',
    [username, password, role],
    (err, res) => {
      if (err) {
        console.log(err.message)
      } else {
        console.log('Data insert successful')
      }
    }
  )
}

function changePassword(username, password) {
  const res = client.query(
    'UPDATE auth SET password = $1 WHERE username = $2',
    [password, username],
    (err, res) => {
      if (err) {
        console.log(err.message)
      } else {
        console.log('Data update successful')
      }
    }
  )
}

// profile

function createProfile(
  username,
  name,
  description,
  website,
  location,
  image,
  role
) {
  client.query(
    'INSERT INTO profile (username, name, description, website, location, image, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
    [username, name, description, website, location, image, role],
    (err, res) => {
      if (err) {
        console.log(err.message)
      } else {
        console.log('Data insert successful')
      }
    }
  )
}

// product

const storageProduct = multer.diskStorage({
  destination: path.join(__dirname, 'public/uploads/product'),
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})

const storageProfile = multer.diskStorage({
  destination: path.join(__dirname, 'public/uploads/profile'),
  filename: (req, file, cb) => {
    cb(null, file.originalname)
  },
})

// async function addProduct(serialNumber, name, brand, apiRes) {
//   const qrCodeData = `{"serialNumber":"${serialNumber}","name":"${name}","brand":"${brand}"}`;

//   qr.toDataURL(qrCodeData, async (err, data_url) => {
//     if (err) {
//       console.log(err);
//       res.status(500).send("Error occurred while generating QR Code");
//     } else {
//       try {
//         let generatedQrCode = data_url;

//         await client.query(
//           "INSERT INTO product (serialNumber, name, brand, qr_code) VALUES ($1, $2, $3,$4)",
//           [serialNumber, name, brand, generatedQrCode],
//           async (err, res) => {
//             if (err) {
//               console.log(err.message);
//             } else {
//               let fetchedQR = await client.query(
//                 `SELECT qr_code FROM product where serialnumber = ${serialNumber}`
//               );
//               // return fetchedQR.rows
//               apiRes
//                 .status(200)
//                 .json({ message: "ok bhava", qr: fetchedQR.rows });
//               // console.log("Data insert successful", fetchedQR.rows);
//             }
//           }
//         );
//         // res.status(200).json({ generatedQrCode })
//       } catch (error) {
//         console.log(error);
//         res.status(500).send("Something went wrong while saving data");
//       }
//     }
//   });

// }

// auth
app.get('/authAll', async (req, res) => {
  const data = await client.query('Select * from auth')
  res.header('Access-Control-Allow-Credentials', true)
  res.send(data.rows)
  console.log('Data sent successfully')
})

app.post('/auth/:username/:password', async (req, res) => {
  const { username, password } = req.params
  const data = await client.query(
    `SELECT * FROM auth WHERE username = '${username}' AND password = '${password}'`
  )
  res.send(data.rows)
  console.log('Data sent successfully')
})

app.post('/addaccount', (req, res) => {
  const { username, password, role } = req.body
  createAccount(username, password, role)
  res.send('Data inserted')
})

app.post('/changepsw', (req, res) => {
  const { username, password } = req.body
  changePassword(username, password)
  res.send('Data updated')
})

// profile

app.get('/profileAll', async (req, res) => {
  const data = await client.query('Select * from profile')
  res.header('Access-Control-Allow-Credentials', true)
  res.send(data.rows)
  console.log('Data sent successfully')
})

app.get('/profile/:username', async (req, res) => {
  const { username } = req.params
  const data = await client.query(
    `SELECT * FROM profile WHERE username = '${username}'`
  )
  res.send(data.rows)
  console.log('Data sent successfully')
})

// app.post('/addprofile', upload.single('image'), (req, res) => {
app.post('/addprofile', (req, res) => {
  const { username, name, description, website, location, image, role } =
    req.body
  createProfile(username, name, description, website, location, image, role)
  res.send('Data inserted')
})

// image

app.post('/upload/profile', (req, res) => {
  let upload = multer({ storage: storageProfile }).single('image')

  upload(req, res, (err) => {
    if (!req.file) {
      return res.send('Please select an image to upload')
    } else if (err instanceof multer.MulterError) {
      return res.send(err)
    } else if (err) {
      return res.send(err)
    }
  })
})

// product

app.post('/upload/product', (req, res) => {
  let upload = multer({ storage: storageProduct }).single('image')

  upload(req, res, (err) => {
    if (!req.file) {
      return res.send('Please select an image to upload')
    } else if (err instanceof multer.MulterError) {
      return res.send(err)
    } else if (err) {
      return res.send(err)
    }
  })
})

app.get('/file/profile/:fileName', function (req, res) {
  const { fileName } = req.params
  const filePath = path.join(__dirname, 'public/uploads/profile', fileName)
  res.sendFile(filePath)
})

app.get('/file/product/:fileName', function (req, res) {
  const { fileName } = req.params
  const filePath = path.join(__dirname, 'public/uploads/product', fileName)
  res.sendFile(filePath)
})

app.get('/product/serialNumber', async (req, res) => {
  const data = await client.query(`SELECT serialNumber FROM product`)
  res.send(data.rows)
})

app.post('/product/verify', async (req, res) => {
  const data = await client.query(
    `SELECT * FROM product where serialnumber = ${req.body.serialNumber}`
  )
  const isExist = data?.rows?.length > 0
  res.status(200).json({ verified: isExist })
})

app.post('/addproduct', async (req, res) => {
  const { serialNumber, name, brand } = req.body

  const qrCodeData = `{"serialNumber":"${serialNumber}","name":"${name}","brand":"${brand}"}`

  qr.toDataURL(qrCodeData, async (err, data_url) => {
    if (err) {
      console.log(err)
      res.status(500).send('Error occurred while generating QR Code')
    } else {
      try {
        let generatedQrCode = data_url

        await client.query(
          'INSERT INTO product (serialnumber, name, brand, qr_code) VALUES ($1, $2, $3,$4)',
          [serialNumber, name, brand, generatedQrCode],
          async (err, qrRes) => {
            if (err) {
              console.log(err.message)
            } else {
              let fetchedQR = await client.query(
                `SELECT qr_code FROM product where serialnumber = ${serialNumber}`
              )
              res.status(200).json({
                message: 'Product added successfully',
                qr: fetchedQR?.rows[0]?.qr_code,
              })
            }
          }
        )
      } catch (error) {
        console.log(error)
        res.status(500).send('Something went wrong while saving data')
      }
    }
  })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
