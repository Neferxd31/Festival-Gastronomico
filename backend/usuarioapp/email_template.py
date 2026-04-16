def reset_password_template(token):
    return f"""
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{
                margin: 0;
                padding: 0;
                background: #111111;
                font-family: Arial, Helvetica, sans-serif;
            }}

            .wrapper {{
                width: 100%;
                padding: 40px 15px;
                background: linear-gradient(180deg, #111111 0%, #1a1a1a 100%);
            }}

            .card {{
                max-width: 620px;
                margin: auto;
                background: #181818;
                border-radius: 18px;
                overflow: hidden;
                border: 1px solid #2b2b2b;
                box-shadow: 0 8px 30px rgba(0,0,0,0.45);
            }}

            .hero {{
                padding: 40px 35px 20px 35px;
                text-align: center;
                background:
                    linear-gradient(
                        rgba(0,0,0,0.65),
                        rgba(0,0,0,0.75)
                    ),
                    linear-gradient(135deg, #2a1a00 0%, #111111 100%);
            }}

            .logo {{
                margin-bottom: 18px;
            }}

            .logo img {{
                width: 95px;
                height: auto;
            }}

            .title {{
                margin: 0;
                font-size: 42px;
                font-weight: 800;
                color: #f4c400;
                letter-spacing: -1px;
            }}

            .subtitle {{
                margin-top: 14px;
                font-size: 18px;
                color: #ffffff;
                line-height: 1.5;
            }}

            .highlight {{
                color: #f4c400;
                font-weight: bold;
            }}

            .content {{
                padding: 30px 35px 40px 35px;
                color: #f5f5f5;
                text-align: center;
            }}

            .text {{
                font-size: 16px;
                line-height: 1.7;
                color: #dddddd;
                margin-bottom: 18px;
            }}

            .code-box {{
                margin: 28px auto;
                display: inline-block;
                padding: 18px 28px;
                border-radius: 14px;
                background: #f4c400;
                color: #111111;
                font-size: 34px;
                font-weight: 800;
                letter-spacing: 8px;
                box-shadow: 0 0 20px rgba(244,196,0,0.35);
            }}

            .expire {{
                color: #f4c400;
                font-size: 15px;
                font-weight: bold;
                margin-top: 8px;
            }}

            .footer {{
                margin-top: 30px;
                font-size: 13px;
                color: #9a9a9a;
                line-height: 1.6;
                border-top: 1px solid #2a2a2a;
                padding-top: 20px;
            }}

            .brand {{
                margin-top: 10px;
                color: #f4c400;
                font-weight: bold;
            }}

            @media only screen and (max-width: 600px) {{
                .title {{
                    font-size: 34px;
                }}

                .subtitle {{
                    font-size: 16px;
                }}

                .code-box {{
                    font-size: 28px;
                    letter-spacing: 5px;
                    padding: 16px 20px;
                }}

                .hero,
                .content {{
                    padding-left: 22px;
                    padding-right: 22px;
                }}
            }}
        </style>
    </head>

    <body>
        <div class="wrapper">

            <div class="card">

                <div class="hero">

                    <div class="logo">
                        <!-- REEMPLAZA ESTA URL POR TU LOGO -->
                        <img src="https://res.cloudinary.com/ds1jzhu4b/image/upload/q_auto/f_auto/v1776222815/logo_w0ycq8.webp" alt="Logo Festival">
                    </div>

                    <div class="subtitle">
                        Recupera tu acceso al panel del
                        <span class="highlight">Festival Gastronómico</span>
                    </div>

                </div>

                <div class="content">

                    <div class="text">
                        Recibimos una solicitud para restablecer tu contraseña.
                    </div>

                    <div class="text">
                        Usa el siguiente código de verificación:
                    </div>

                    <div class="code-box">{token}</div>

                    <div class="expire">
                        Expira en 15 minutos
                    </div>

                    <div class="footer">
                        Si no solicitaste este cambio, puedes ignorar este mensaje.
                        <div class="brand">
                            Festival Gastronómico Los Patios
                        </div>
                    </div>

                </div>

            </div>

        </div>
    </body>
    </html>
    """