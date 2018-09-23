var express = require('express');
var router = express.Router();
// SISTEMA DE ARQUIVOS DO NODE, VERIFICAR ARQUIVOS NO SERVIDOR
var fs = require('fs');
// DEPENDENCIA PARA GERENCIAR UPLOAD DE ARQUIVOS
var formidable = require('formidable');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


/* GET home page. */
router.get('/file', function(req, res, next) {

  let path = './' + req.query.path;

  if(fs.existsSync(path)){
    
    fs.readFile(path, (err, data) =>{
      if(err){
        console.log(err);
        res.status(400).json({ error: err });
      
      }else{
        res.status(200).end(data);
      }
    });

  }else{
    res.status(404).json({
        error: 'File not found.'        
    });
  }

});

router.delete('/file', function(req, res){

  let form = new formidable.IncomingForm({
    uploadDir: './upload',      // pasta onde se eoncontra o arquivo
    keepExtensions: true        // matem a extensão do arquivo que veio.
  });

  // Faça o parse, interprete os dados que chegaram na requisição
  form.parse(req, (err, fields, files) =>{    

    let path = "./" + fields.path;
    // se existir o arquivo neste diretorio, entre
    if(fs.existsSync(path)){
      // remover o arquivo, e se houver um erro, responda com status
      fs.unlink(path, err => {
        if(err){
          res.status(400).json({
            err
          })
        }else{
          res.json({ fields });
        }
      })
    }else{
      res.status(404).json({
          error: 'File not found.'        
      });
    }
  });

})

router.post('/upload', function(req, res){

  // Recupera os dados no formulario, file.
  let form = new formidable.IncomingForm({
    uploadDir: './upload',      // pasta para salvar o file
    keepExtensions: true        // matem a extensão do arquivo que veio.
  });

  // Faça o parse, interprete os dados que chegaram na requisição
  form.parse(req, (err, fields, files) =>{    
    res.json({ files: files });
  });

})

module.exports = router;
