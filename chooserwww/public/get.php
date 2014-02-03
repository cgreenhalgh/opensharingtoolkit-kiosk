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
flush();
$m = $_GET['m'];
// try to read mimetypes.json
$mimetypesin = file_get_contents('mimetypes.json');
//echo 'mimetypes = '.$mimetypesin.'\n'; flush();
$mimetypes = null;
$json_decode = 'json_decode';
//echo 'is_callable? '.is_callable($json_decode).'\n'; flush();
//echo 'json_decode='.json_decode.'\n'; flush();
if (!empty($mimetypesin))
  $mimetypes = json_decode($mimetypesin, TRUE);
//echo 'mimetypes='.$mimetypes.'\n'; flush();
$mimetype = null;
if (!empty($mimetypes) && !empty($m))
  $mimetype = $mimetypes[$m];
//echo 'mimetype = '.$mimetype.'\n'; flush();
if (empty($mimetype) || empty($mimetype['compat'])) {
  echo '<p>Warning: this content may not be supported on your device! (I can\'t tell because I am cannot get information about its MIME type)</p>';  
} else {
  $compat = null;
  $devicetype = null;
  foreach ($mimetype['compat'] as $dt => $mtcompat) {
    //echo 'test '.$dt.'\n'; flush();
    if ($compat===null && $dt=="other") {
      // default
      $devicetype = $dt;
      $compat = $mtcompat;
    }
    if (!empty($mtcompat['userAgentPattern']) && !empty($userAgent)) {
      if (strpos($mtcompat['userAgentPattern'],'/')!==0)
        $mtcompat['userAgentPattern'] = '/'.$mtcompat['userAgentPattern'].'/';
      if (preg_match($mtcompat['userAgentPattern'], $userAgent)===1) {
        //echo 'userAgent match '.$dt.' with '.$mtcompat['userAgentPattern'].'\n'; flush();
        $compat = $mtcompat;
        $devicetype = $dt;
      } else {
        //echo 'userAgent match failed for '.$userAgent.' with '.$mtcompat['userAgentPattern'].'\n'; flush();
      }
    }
  }
  if (empty($compat))
    echo '<p>Warning: this content may not be supported on your device! (As far as I can tell your device type is '.$devicetype.' but I cannot find any compatibility information for MIME type '.$m.')</p>';
  else {
    if (!empty($compat['apps'])) {
      foreach ($compat['apps'] as $app) {
        echo '<p>Note: ';
        echo 'you may need <a href="'.$app['url'].'">'.$app['name'].'</a> or a similar helper application to view this download. (I think your device type is '.$devicetype.')</p>';
      }
      if (!empty($ssid))
        echo '<p>You may need to switch back to standard Internet to download the helper application.</p>';
    } else if ($compat['builtin']!==TRUE) 
      echo '<p>Warning: this content may not be supported on your device! (I think your device type is '.$devicetype.')</p>';
    else
      echo '<p>This content should have built-in support on your device. (I think your device type is '.$devicetype.')</p>';
  }
}
?><p><?php
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
