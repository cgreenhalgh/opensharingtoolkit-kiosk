<?php
$userAgent = $_SERVER['HTTP_USER_AGENT'];
$userAddr = $_SERVER['REMOTE_ADDR'];
$userPort = $_SERVER['REMOTE_PORT'];
$referer = $_SERVER['HTTP_REFERER'];
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
      'event'=>'php.get',
      'component'=>'php',
      'level'=>4,
      'info'=>$info
    );
    $json = json_encode($jo);
    file_put_contents('php.log',PHP_EOL.$json,FILE_APPEND|LOCK_EX);
    header('Content-type: text/html');
?><!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<meta name="viewport" content="width=device-width, user-scalable=false;">
<title>Kiosk phone helper</title>
</head>
<body>
<p>Great! You're on the <?php
$ssid = $_GET['n'];
if (!empty($ssid)) 
  echo 'right nextwork ('.$ssid.')'; 
else
  echo 'Internet';
?></p>
<h1 style="">Get <?php echo $_GET['t']; ?></h1>
<?php
$reqDevice = $_GET['d'];
$dnames = array( 'ios' => 'an iPhone or iPad',
  'android' => 'an Android phone or tablet',
  'windowsmobile' => 'a Windows Phone',
  'other' => 'some other kind of device' );
function dname($d) {
  if ($dnames[$d]) 
    return $dnames[$d];
  else
    return 'a '.$d.' device';
}
$userAgent = $_SERVER['HTTP_USER_AGENT'];
$device = null;
if (strpos($userAgent,'iPhone')!==FALSE || strpos($userAgent,'iPod')!==FALSE || strpos($userAgent,'iPad')!==FALSE)
  $device = 'ios';
else if (strpos($userAgent,'Android')!==FALSE)
  $device = 'android';
if ($reqDevice!=$device) {
  echo '<p>Warning: ';
  if (!empty($device)) { echo 'this looks like '.dname($device); }
  else { echo 'I\'m not sure what kind of device this is'; }
  if (!empty($reqDevice) && reqDevice!='other') {
    echo ' but you said it was '.dname($reqDevice);
  }
  echo '; you might need a different helper application to view this download</p>';
} 
$appurl = $_GET['a'];
if (isset($appurl)) {
 if ($appurl==='') 
    echo '<p>Warning: this content may not be supported on your device!</p>';
  else {
    echo '<p>Note: ';
    if (!empty($reqDevice)) echo 'for '.dname($reqDevice).' ';
    echo 'you may need <a href="'.$appurl.'">this helper application</a> to view this download.</p>'; 
    if (!empty($ssid)) 
      echo '<p>You may need to switch back to standard Internet to download the helper application.</p>';
  }
}
?>
<p><?php
$url = $_GET['u'];
if (!empty($url)) {
  // special-case using send? only local files and mime type given!
  // nothing with query parameters, at least for now
  $m = $_GET['m'];
  if (!empty($m) && strpos($url,'?')===FALSE) {
    //echo '<p>send '.$url.' - strpos='.strpos($url,'%3F');
    $requestUri =$_SERVER['REQUEST_URI'];
    // must be called get.php ?!
    $ix = strpos($requestUri, '/get.php?');
    if ($ix!==FALSE) {
      $host = $_SERVER['HTTP_HOST'];
      $base = "";
      if (strpos($url,':')===FALSE) {
        if (strpos($url, '/')===0)
          // absolute
          $base = substr($requestUri, 0, $ix+1);
      } else 
        // full
        $base = "http://".$host.substr($requestUri,0,$ix+1);
      if (strlen($base)==0 || strpos($url,$base)===0) {
        //echo '<p>base = '.htmlentities($base).'</p>';
        $f = substr($url,strlen($base));
        $url = "send.php?f=".urlencode($f)."&m=".urlencode($m);
      } 
    }
  }
  echo '<a style="font-size:24pt;" href="'.$url.'" style="">Download</a>';
} else
  echo 'Sorry, something went wrong opening this page - I don\'t know what content you were trying to get; please go back and try again.';	
?></p>
</body>
</html>
