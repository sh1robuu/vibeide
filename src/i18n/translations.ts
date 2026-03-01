export type Language = 'en' | 'vi';

export const translations = {
  en: {
    landing: {
      login: "Log in",
      signup: "Sign up",
      badge: "The next generation AI-powered IDE",
      titlePrefix: "Code at the speed of",
      words: ["thought.", "ideas.", "imagination.", "speed."],
      description: "VibeCraft is an intelligent, beautiful, and blazing fast development environment that learns from you and helps you build better software, faster.",
      startCoding: "Start coding for free",
      tryEditor: "Try the Editor",
      features: {
        fast: {
          title: "Lightning Fast",
          desc: "Built on modern web technologies to ensure your editor never gets in the way of your thoughts."
        },
        ui: {
          title: "Beautiful UI",
          desc: "A carefully crafted interface that reduces eye strain and keeps you focused on what matters."
        },
        tools: {
          title: "Integrated Tools",
          desc: "Everything you need from terminal to debugging, built right into your workspace."
        }
      }
    },
    auth: {
      welcomeBack: "Welcome back",
      createAccount: "Create an account",
      loginDesc: "Enter your details to sign in to your workspace",
      signupDesc: "Start building your next big idea today",
      name: "Name",
      namePlaceholder: "John Doe",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password",
      forgotPassword: "Forgot password?",
      signIn: "Sign In",
      createAccountBtn: "Create Account",
      orContinueWith: "Or continue with",
      noAccount: "Don't have an account? ",
      hasAccount: "Already have an account? ",
      signUpLink: "Sign up",
      logInLink: "Log in"
    },
    ide: {
      sidebar: {
        files: "Files",
        editor: "Editor",
        console: "Console",
        profile: "Profile",
        logout: "Log out",
        settings: "Settings"
      },
      header: {
        share: "Share",
        publish: "Publish",
        mode: "mode"
      },
      fileExplorer: {
        title: "Explorer",
        newFile: "New File",
        newFolder: "New Folder"
      },
      editor: {
        preview: "Preview",
        code: "Code"
      },
      bottomPanel: {
        problems: "Problems",
        output: "Output",
        debug: "Debug Console",
        terminal: "Terminal",
        ports: "Ports"
      },
      agent: {
        title: "VibeCraft AI Mentor",
        placeholder: "Ask me anything about your code...",
        suggestions: {
          explain: "Explain this code",
          refactor: "Refactor for performance",
          findBugs: "Find potential bugs"
        }
      },
      settings: {
        title: "Settings",
        theme: "Editor Theme",
        themes: {
          dark: "Dark Modern",
          highContrast: "High Contrast",
          light: "Light"
        },
        fontSize: "Font Size",
        keybindings: "Keybindings",
        formatting: "Formatting",
        formatOnSave: "Format on Save",
        formatOnSaveDesc: "Automatically format code using Prettier when saving"
      }
    }
  },
  vi: {
    landing: {
      login: "Đăng nhập",
      signup: "Đăng ký",
      badge: "IDE tích hợp AI thế hệ mới",
      titlePrefix: "Lập trình với tốc độ của",
      words: ["suy nghĩ.", "ý tưởng.", "trí tưởng tượng.", "ánh sáng."],
      description: "VibeCraft là một môi trường phát triển thông minh, tuyệt đẹp và siêu tốc, học hỏi từ bạn và giúp bạn xây dựng phần mềm tốt hơn, nhanh hơn.",
      startCoding: "Bắt đầu lập trình miễn phí",
      tryEditor: "Thử nghiệm Editor",
      features: {
        fast: {
          title: "Nhanh như chớp",
          desc: "Được xây dựng trên các công nghệ web hiện đại để đảm bảo trình chỉnh sửa không bao giờ cản trở dòng suy nghĩ của bạn."
        },
        ui: {
          title: "Giao diện tuyệt đẹp",
          desc: "Một giao diện được thiết kế tỉ mỉ giúp giảm mỏi mắt và giữ bạn tập trung vào những điều quan trọng."
        },
        tools: {
          title: "Công cụ tích hợp",
          desc: "Mọi thứ bạn cần từ terminal đến gỡ lỗi, được tích hợp ngay trong không gian làm việc của bạn."
        }
      }
    },
    auth: {
      welcomeBack: "Chào mừng trở lại",
      createAccount: "Tạo tài khoản",
      loginDesc: "Nhập thông tin của bạn để đăng nhập vào không gian làm việc",
      signupDesc: "Bắt đầu xây dựng ý tưởng lớn tiếp theo của bạn ngay hôm nay",
      name: "Tên",
      namePlaceholder: "Nguyễn Văn A",
      email: "Email",
      emailPlaceholder: "ban@example.com",
      password: "Mật khẩu",
      forgotPassword: "Quên mật khẩu?",
      signIn: "Đăng nhập",
      createAccountBtn: "Tạo tài khoản",
      orContinueWith: "Hoặc tiếp tục với",
      noAccount: "Chưa có tài khoản? ",
      hasAccount: "Đã có tài khoản? ",
      signUpLink: "Đăng ký",
      logInLink: "Đăng nhập"
    },
    ide: {
      sidebar: {
        files: "Tệp tin",
        editor: "Trình soạn thảo",
        console: "Bảng điều khiển",
        profile: "Hồ sơ",
        logout: "Đăng xuất",
        settings: "Cài đặt"
      },
      header: {
        share: "Chia sẻ",
        publish: "Xuất bản",
        mode: "chế độ"
      },
      fileExplorer: {
        title: "Tệp tin",
        newFile: "Tệp mới",
        newFolder: "Thư mục mới"
      },
      editor: {
        preview: "Xem trước",
        code: "Mã nguồn"
      },
      bottomPanel: {
        problems: "Vấn đề",
        output: "Đầu ra",
        debug: "Gỡ lỗi",
        terminal: "Terminal",
        ports: "Cổng"
      },
      agent: {
        title: "VibeCraft AI Mentor",
        placeholder: "Hỏi tôi bất cứ điều gì về mã của bạn...",
        suggestions: {
          explain: "Giải thích mã này",
          refactor: "Tối ưu hóa hiệu suất",
          findBugs: "Tìm lỗi tiềm ẩn"
        }
      },
      settings: {
        title: "Cài đặt",
        theme: "Giao diện",
        themes: {
          dark: "Tối hiện đại",
          highContrast: "Độ tương phản cao",
          light: "Sáng"
        },
        fontSize: "Cỡ chữ",
        keybindings: "Phím tắt",
        formatting: "Định dạng",
        formatOnSave: "Định dạng khi lưu",
        formatOnSaveDesc: "Tự động định dạng mã bằng Prettier khi lưu"
      }
    }
  }
};
