const express = require('express');
const app = express();
const { exec } = require('child_process');
const fs = require('fs');

app.use(express.json()); 
app.use(express.static('.'));

app.get('/',(req,res)=>{
    res.sendFile('index.html')
})

app.post('/', (req, res) => {

  // Get Circom code from request body
  const code = req.body.code;
  fs.writeFileSync('code.circom', code); 
  // Command to compile Circom code
  const compileCmd = `circom code.circom --r1cs --wasm`; 

  exec(compileCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Compilation error: ${error}`);  
      return res.status(500).send('Compilation failed');
    }
    console.log(`Compilation succeeded`);
    res.send('Compilation successful!');
  });

});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});