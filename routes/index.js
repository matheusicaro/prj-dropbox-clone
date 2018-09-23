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
