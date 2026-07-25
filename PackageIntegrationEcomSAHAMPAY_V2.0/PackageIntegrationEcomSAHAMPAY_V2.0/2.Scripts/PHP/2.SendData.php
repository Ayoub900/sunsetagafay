<?php
// clear special characters
function str_without_accents($str, $charset='utf-8'){
	$str = htmlentities($str, ENT_NOQUOTES, $charset);
	$str = preg_replace('#&([A-za-z])(?:acute|cedil|caron|circ|grave|orn|ring|slash|th|tilde|uml);#', '\1', $str);
	$str = preg_replace('#&([A-za-z]{2})(?:lig);#', '\1', $str);
	$str = preg_replace('#&[^;]+;#', '', $str);
	$str = preg_replace('/[^a-zA-Z0-9_ -]/s','',$str);
	return $str;
}
?>
<html>
<head>
<title>Generic Hash Request Handler</title>
<meta http-equiv="Content-Language" content="tr">
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-9">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="now">
</head>

<body onload="javascript:moveWindow()">

	<form name="pay_form" method="post" action="https://test-sahampay.cmi.co.ma/fim/est3Dgate">
		<?php
		
			$storeKey = "TEST1234";	
			
			
			$paramsCleared = ['BillToName', 'BillToCompany', 'BillToStreet1', 'BillToCity', 'BillToStateProv', 'BillToPostalCode', 'BillToCountry'];
			
			$postParams = array();
			foreach ($_POST as $key => $value){
				array_push($postParams, $key);
				if (in_array($key, $paramsCleared)){
					$value = trim(str_without_accents($value));
				} else {
					$value = trim($value);
				}
				echo "<input type=\"hidden\" name=\"" .$key ."\" value=\"" .$value."\" /><br />";
			}
			natcasesort($postParams);		
			
			$hashval = "";

        foreach ($postParams as $param){
				if (in_array($param, $paramsCleared)){
					$paramValue = trim(str_without_accents($_POST[$param]));
				} else {
					$paramValue = trim($_POST[$param]);
				}
				$escapedParamValue = str_replace("|", "\\|", str_replace("\\", "\\\\", $paramValue));	
					
				$lowerParam = strtolower($param);
				if($lowerParam != "hash" && $lowerParam != "encoding" )	{
					$hashval = $hashval . $escapedParamValue . "|";
				}
			}

			$escapedStoreKey = str_replace("|", "\\|", str_replace("\\", "\\\\", $storeKey));	
			$hashval = $hashval . $escapedStoreKey;
			
			$calculatedHashValue = hash('sha512',$hashval);
			$hash = base64_encode (pack('H*',$calculatedHashValue));

			echo "<input type=\"hidden\" name=\"HASH\" value=\"" .$hash."\" /><br />";			
		
		?>
	</form>
	
	  <script type="text/javascript" language="javascript">
        function moveWindow() {
           document.pay_form.submit();
        }
    </script>

</body>

</html>