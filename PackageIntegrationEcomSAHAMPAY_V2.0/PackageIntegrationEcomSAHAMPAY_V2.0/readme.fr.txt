*********************************************************************************************************************
 Objet : Kit d'intégration du Module CMI pour le paiement en ligne												
																												 	
 Version :  V2.0 de mars 2022																					
																												 
 Copyright (c) 2022 Centre Monétique Interbancaire (CMI). Tous droits réservés.								
*********************************************************************************************************************



Présentation :
--------------
Ce kit vous permet d'intégrer, sur votre site marchand, le module du paiement en ligne du Centre Monétique Interbancaire (CMI).


Contenu :
---------
Ce kit contient les élement suivants :
												===================================
																Doc
												===================================
	* /Docs/
	  Il s'agit de la documentation qui explique les techniques d'interfaçage avec la plate-forme ECOM CMI pour le paiement en ligne.
		
		
												===================================
																Script
												===================================											
	* /Scripts/
	  Il s'agit d'exemples de scripts en c#.net, jsp, php, vb.net qui présentent les différentes requêtes échangées entre le site marchand et la plate-forme ECOM CMI pour le paiement en ligne.	  


												===================================
															Plugins CMS
												===================================
	  Le CMI dispose de plugins compatibles avec les CMS ci-dessous. L'utilisation de ces plugins permet une intégration simple et rapide du module de paiement en ligne du CMI.
	  - Prestashop 1.6
	  - Prestashop 1.7
	  - Prestashop 8.XX
	  - WordPress WooCommerce
	  - WordPress Donation
	  - Joomla VirtueMart
	  - Magento 1.9
	  - Magento 2
	  - Drupal 8 Commerce
	  - Drupal 8 Ubercart
	  - OpenCart 3
	  - WHMCS
	  - Bundle Symfony 4
	  - Odoo 12
	  - Odoo 13
	  - Odoo 14
	  - Odoo 15
	  - Odoo 16
	  - Odoo 17
	  - Odoo 18
	  - Moodle
	  - Lightspeed
	  

	
												===================================
																Charte
												===================================	 
	* /Charte/logos de sécurité (obligatoires)/
	  Il s'agit de ressources graphiques obligatoires (logos) à mettre sur le site marchand afin d'assurer le client acheteur quant aux entités qui se chargent du traitement sécurisé des transactions en ligne.

	* /Charte/cgv/
	  Il s'agit d'un modèle des Conditions Générales de Vente (CGV) qui présentent le contrat "virtuel" engageant les différentes parties (Marchand et clients). 
	  Dans ce modèle, les clauses métier sont à adapter par le marchand selon le contexte de son business. Quant aux clauses concernant le paiement (surlignées avec une couleur différente), elles sont à reprendre au niveau des CGV du site marchand.


												===================================
												 Guide d'Utilisation (back Office)
												===================================
	* (Voir le lien de téléchargement du guide dans l'email du kit d'intégration que vous avez reçu)  
	  Il s'agit du document qui explique la procédure de gestion et d’administration des transactions en ligne au niveau de l'espace privé (back office) octroyé aux marchands

												
	  
												===================================
														Tests de certification
												===================================
	* /TestsCertification/Cmi_eMerchant_Certification.xlsx
	  Vous êtes appelés à réaliser les tests décrits dans ce fichier et retourner par email à l'équipe Intégration ECOM du CMI le fichier complété par vos soins en précisant le résultat de chaque test.
	  
	  * /TestsCertification/CmiTestCards.xlsx
	  Il s'agit d'une liste de cartes de tests qui peuvent être utilisées sur l’environnement de test permettant d'effectuer des transactions de test.



												
	  
Pré-requis :
------------
Pour pouvoir exploiter ce kit, il est nécessaire d'avoir reçu au préalable : 
	* les données d'authentification (login/password) pour pouvoir télécharger les ressources nécessaires
	* un numéro de magasin de test
	* l'URL de la passerelle de test
	* les coordonées d'une carte de paiement de test
	* un compte marchand d'accès au back office de suivi des transactions en ligne

	
Support :
---------
Pour plus d'informations, veuillez envoyer un courriel à integration.ecom@cmi.co.ma
