<%@page contentType="text/html;charset=UTF-8"%>
<%@page import="org.apache.commons.codec.binary.Base64"%>
<%@page import="java.security.MessageDigest"%>

<%@page import="java.util.Locale"%>
<%@page import="java.util.Map"%>
<%@page import="java.util.Map.Entry"%>
<%@page import="java.util.Set"%>
<%@page import="java.util.SortedMap"%>
<%@page import="java.util.TreeMap"%>
<%@page import="java.util.Vector"%>
<%@page import="java.util.List"%>
<%@page import="java.util.Comparator"%>
<%@page import="java.util.Arrays"%>
<%@page import="java.util.List"%>



<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
   "http://www.w3.org/TR/html4/loose.dtd">

<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>Generic Hash Request Handler</title>


</head>
<body onload="javascript:moveWindow()">

	<form name="pay_form" method="post" action="https://test-sahampay.cmi.co.ma/fim/est3Dgate">
		<%
			String storeKey = "TEST1234";
			
			request.setCharacterEncoding("UTF-8");
		    // create sorted map
		    SortedMap<String, String> allRequestParams = new TreeMap<String, String>(new Comparator<String>() {
		        public int compare(String str1, String str2) {
		            str1 = str1.toUpperCase(Locale.US);
		            str2 = str2.toUpperCase(Locale.US);
		            return str1.compareTo(str2);
		        }
		    });
		    // get all paramater map
		    Map<String, String[]> parameterMap = request.getParameterMap();
		    Set<String> requestParams = parameterMap.keySet();

		    String[] paramsCleared= new String[]{"BillToName",".BillToCompany", "BillToCity","BillToStreet1","BillToStateProv","BillToPostalCode","BillToCountry"};
	        // Convert String Array to List
	        List<String> listparamsCleared = Arrays.asList(paramsCleared);
	        String requestParamVal = "";
		    boolean isParamClear = true;
		    boolean isParamClear2 = true;
		    for (String requestParam : requestParams) {
		        String[] allRequestParamValues = parameterMap.get(requestParam);
		        if (allRequestParamValues != null && allRequestParamValues.length > 0) {
		            String value = allRequestParamValues[0];
		            allRequestParams.put(requestParam, value);
			    	isParamClear = listparamsCleared.contains(requestParam);
		            if(!isParamClear){
			        		requestParamVal = value.trim();
			        	} else {
			        		requestParamVal = value.replaceAll("[^0-9A-Za-z _-]", "").trim();
			        	}
		%>
						<input type="hidden" name="<%=requestParam.trim()%>" value="<%=requestParamVal%>">
		<%
		    }
		    }
		    // init hash value 
		    String hashval3 = "";
		    for (String requestParam : allRequestParams.keySet()) {
		    	isParamClear2 = listparamsCleared.contains(requestParam);
		        String lowerParam = requestParam.toLowerCase(Locale.US);
		        if (!lowerParam.equals("encoding") && !lowerParam.equals("hash")) {
		        	if(!isParamClear2){
		            hashval3 += request.getParameter(requestParam).replace("\\", "\\\\").replace("|", "\\|").trim() + "|";
		        	} else {
			            hashval3 += request.getParameter(requestParam).replaceAll("[^0-9A-Za-z _-]", "").replace("\\", "\\\\").replace("|", "\\|").trim() + "|";
		        	}
		        }
		    }
		    
		    %>
		    <%=hashval3%>
		    <%
		    storeKey = storeKey.replace("\\", "\\\\").replace("|", "\\|");
		    hashval3 += storeKey;
		    

		    MessageDigest messageDigest = MessageDigest.getInstance("SHA-512");
		    messageDigest.update(hashval3.getBytes("UTF-8"));
		    String hash = new String(Base64.encodeBase64(messageDigest.digest()), "UTF-8");
		%>
		<input type="hidden" name="hash" value="<%=hash%>">

	</form>
	</center>
	
	
	<script type="text/javascript" language="javascript">
	function moveWindow() {
		document.pay_form.submit();
	}
</script>

</body>
</html>
