const express = require('express');
const app = express();
const { exec } = require('child_process');
const {execSync} = require('child_process');
const fs = require('fs');

app.use(express.json()); 
app.use(express.static('.'));

// home page
app.get('/',(req,res)=>{
    res.sendFile('index.html')
})

// compiling circom code
app.post('/compile', (req, res) => {

  const code = req.body.code;
  fs.writeFileSync('code.circom', code); 
  
  const compileCmd = `circom code.circom --r1cs --wasm --sym`; 

  exec(compileCmd, (error, stdout, stderr) => {
    if (error) {
      console.error(`Compilation error: ${error}`);  
      return res.send(stderr);
    }
    res.send(stdout);
    console.log(stdout)
  });

});



// generating witness file

app.post('/generateWitness',(req,res)=>{

    execSync(`node ./code_js/generate_witness.js ./code_js/code.wasm input.json witness.wtns`);
    execSync('snarkjs wtns export json witness.wtns witness.json');

    const jsonString = fs.readFileSync('witness.json', 'utf8');
    const json = JSON.parse(jsonString);
    const result = json[1];
    console.log(result)
    
})

// generating proving keys

app.post('/pk/groth16',(req,res)=>{
  execSync('snarkjs groth16 setup code.r1cs powersOfTau28_hez_final_12.ptau circuit_0000.zkey')
})

app.post('/pk/plonk',(req,res)=>{
  execSync('snarkjs fflonk setup code.r1cs powersOfTau28_hez_final_12.ptau circuit_0000.zkey')
})

app.post('/pk/fflonk',(req,res)=>{
  execSync('snarkjs fflonk setup code.r1cs powersOfTau28_hez_final_12.ptau circuit_0000.zkey')
})



// generating the verification key

app.post('/vk',(req,res)=>{
  execSync('snarkjs zkey export verificationkey circuit_0000.zkey verification_key.json')
})


// proof generation

app.post('/proof/groth16',(req,res)=>{
  const stdout = execSync('snarkjs groth16 prove circuit_0000.zkey witness.wtns proof.json public.json')
  res.json({ result: stdout.toString() });
})

app.post('/proof/plonk',(req,res)=>{
  execSync('snarkjs plonk prove circuit_0000.zkey witness.wtns proof.json public.json')
})

app.post('/proof/fflonk',(req,res)=>{
  execSync('snarkjs fflonk prove circuit.zkey witness.wtns proof.json public.json')
})

// proof verification

app.post('/verify/groth16', (req, res) => {
  const stdout = execSync('snarkjs groth16 verify verification_key.json public.json proof.json');
  res.json({ result: stdout.toString() }); 
});

app.post('/verify/plonk',(req,res)=>{
  execSync('snarkjs plonk verify verification_key.json public.json proof.json')
})

app.post('/verify/fflonk',(req,res)=>{
  execSync('snarkjs fflonk verify verification_key.json public.json proof.json')
})

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
