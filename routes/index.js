var express = require('express');
var router = express.Router();
// DEPENDENCIA PARA GERENCIAR UPLOAD DE ARQUIVOS
var formidable = require('formidable');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/upload', function(req, res, next){

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
