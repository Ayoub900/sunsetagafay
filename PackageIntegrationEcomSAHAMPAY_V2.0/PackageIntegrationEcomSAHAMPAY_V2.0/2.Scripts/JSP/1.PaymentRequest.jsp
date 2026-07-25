<%@page contentType="text/html;charset=UTF-8"%>
<%@page import="org.apache.commons.codec.binary.Base64"%>
<%@page import="java.security.MessageDigest"%>
 <%@page import="java.io.*"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
   "http://www.w3.org/TR/html4/loose.dtd">

<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>3D PAY HOSTING Model</title>
</head>
<body>
	<%

		    String orgClientId = "600200127";			
		    String orgAmount = "10.25";
		    String orgOkUrl = "https://www.nom_de_domaine.com/Ok.jsp";
		    String orgFailUrl = "https://www.nom_de_domaine.com/Fail.jsp";
		    String orgshopurl = "https://www.nom_de_domaine.com/";
		    String orgTransactionType = "PreAuth";
		    String orgRnd = new java.util.Date().toString();  
		    String orgCallbackUrl = "https://www.nom_de_domaine.com/callback.jsp";
		    String orgCurrency = "504";
	%>
	<center>
		<form method="post" action="2.SendData.jsp">
			<table>
				<tr>
					<td align="center" colspan="2"><input type="submit"	value="Complete Payment" /></td>
				</tr>
			</table>

			<input type="hidden" name="clientid" value="<%=orgClientId%>">
			<input type="hidden" name="amount" value="<%=orgAmount%>">
			<input type="hidden" name="okUrl" value="<%=orgOkUrl%>">
			<input type="hidden" name="failUrl" value="<%=orgFailUrl%>">
			<input type="hidden" name="TranType" value="<%=orgTransactionType%>">
			<input type="hidden" name="callbackUrl" value="<%=orgCallbackUrl%>">
			<input type="hidden" name="shopurl" value="<%=orgshopurl%>">
			<input type="hidden" name="currency" value="<%=orgCurrency%>">
			<input type="hidden" name="rnd" value="<%=orgRnd%>"> 
			<input type="hidden" name="storetype" value="3D_PAY_HOSTING"> 
			<input type="hidden" name="lang" value="fr">
			<input type="hidden" name="hashAlgorithm" value="ver3">
			<input type="hidden" name="BillToName" value="name">
			<input type="hidden" name="BillToCompany" value="billToCompany">
            <input type="hidden" name="refreshtime" value="5">
			<input type="hidden" name="BillToName" value="name">
			<input type="hidden" name="BillToCompany" value="billToCompany">
			<input type="hidden" name="BillToStreet1" value="100 rue adress">
			<input type="hidden" name="BillToCity" value="casablanca">
			<input type="hidden" name="BillToStateProv" value="Maarif Casablanca">
			<input type="hidden" name="BillToPostalCode" value="20230">
			<input type="hidden" name="BillToCountry" value="504">
			<input type="hidden" name="email" value="email@domaine.com">
			<input type="hidden" name="tel" value="0021201020304">
			<input type="hidden" name="encoding" value="UTF-8">
			<input type="hidden" name="oid" value="ABCD1234"> <!-- La valeur du paramètre oid doit être unique par transaction -->

			

		</form>
	</center>
    </body>
</html>
