<?php
$userAgent = $_SERVER['HTTP_USER_AGENT'];
$userAddr = $_SERVER['REMOTE_ADDR'];
$userPort = $_SERVER['REMOTE_PORT'];
$referer = $_SERVER['HTTP_REFERER'];
$file = $_GET['f'];
$mime = $_GET['m'];
if (empty($file) || empty($mime)) {
  die('Bad request');
} else {
  $path = realpath(__DIR__)."/".$file;
  $root = realpath(__DIR__)."/";
  if (strpos($path,$root)!=0 || !file_exists($path)) {
    die('Not found');
  } else {
    $time = time();
    $info = array(
      'remotePort'=>$userPort,
      'remoteAddr'=>$userAddr,
      'referer'=>$referer,
      'userAgent'=>$userAgent,
      'path'=>$_SERVER['REQUEST_URI']
    );
    $jo = array(
      'time'=>$time,
      'event'=>'php.send',
      'component'=>'php',
      'level'=>4,
      'info'=>$info
    );
    $json = json_encode($jo);
    file_put_contents('php.log',PHP_EOL.$json,FILE_APPEND|LOCK_EX);
    $fname = substr($path, strrpos($path,"/")+1);
    # not for html - breaks offline, etc.
    if ($mime != 'text/html')
      header('Content-Disposition: attachment; filename="'.$fname.'"');
    header('Content-type: '.$mime);
    readfile($path);
    //echo 'send '.$path.' as '.$mime;
  }
}
?>
