document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.spacer') || document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            if (navLinks) navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    document.querySelectorAll('.nav-links li a').forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks) navLinks.classList.remove('active');
            if (menuToggle) menuToggle.classList.remove('active');
        });
    });

    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    const accordionHeaders = document.querySelectorAll('.accordion-header');

    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const content = item.querySelector('.accordion-content');
            
            // Cerrar otros elementos abiertos
            const currentActive = document.querySelector('.accordion-item.active');
            if (currentActive && currentActive !== item) {
                currentActive.classList.remove('active');
                currentActive.querySelector('.accordion-content').style.maxHeight = null;
            }

            // Alternar el elemento actual
            item.classList.toggle('active');
            
            if (item.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + "px";
            } else {
                content.style.maxHeight = null;
            }
        });
    });

    const revealElements = document.querySelectorAll('.slide-in-left, .slide-in-right, .reveal');

    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - elementVisible) {
                if (element.classList.contains('slide-in-left')) {
                    element.style.animation = 'slideInLeft 0.8s forwards ease-out';
                } else if (element.classList.contains('slide-in-right')) {
                    element.style.animation = 'slideInRight 0.8s forwards ease-out';
                } else {
                    element.classList.add('active');
                }
            }
        });
    };

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();

    const whatsappConfig = {
        phone: "50254394843",
        message: "¡Hola! Me gustaría obtener más información sobre el proyecto CCInv."
    };

    const btnContactWhatsapp = document.getElementById('btn-contact-whatsapp');
    if (btnContactWhatsapp) {
        btnContactWhatsapp.addEventListener('click', (e) => {
            e.preventDefault();
            const url = `https://wa.me/${whatsappConfig.phone}?text=${encodeURIComponent(whatsappConfig.message)}`;
            window.open(url, '_blank');
        });
    }
});
